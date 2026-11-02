import pool from "../config/db.js";
import {
    STATUSES, FORMATS, PRIORITIES,
    assignableStatuses, canSeeContent, canModifyContent, visibilityClause, today
} from "../utils/permissions.js";

const FIELDS_BY_ROLE = {
    admin: ["channel_id", "title", "description", "script_draft", "format_type", "status", "priority", "scheduled_date", "published_date", "published_url"],
    creator: ["channel_id", "title", "description", "script_draft", "format_type", "status", "priority", "scheduled_date"],
    editor: ["status"],
};

const isHttpUrl = (value) => {
    try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

const fail = (res, status, message, errors) =>
    res.status(status).json({ status: false, message, ...(errors && { errors }) });

const serverError = (res, error) => {
    console.error(error);
    return fail(res, 500, "Internal Server Error");
};

// Validasi bisnis (format respon 422 errors: { field: ["pesan"] } sesuai kebutuhan frontend)
function validateContent(data) {
    const errors = {};
    if (!data.title || !String(data.title).trim()) errors.title = ["Judul wajib diisi"];
    if (!data.channel_id) errors.channel_id = ["Channel wajib dipilih"];
    if (!FORMATS.includes(data.format_type)) errors.format_type = ["Format tidak valid"];
    if (!STATUSES.includes(data.status)) errors.status = ["Status tidak valid"];
    if (!PRIORITIES.includes(data.priority)) errors.priority = ["Prioritas tidak valid"];
    if (data.status === "published") {
        if (!data.published_url) errors.published_url = ["Published URL wajib diisi bila status = Published"];
        else if (!isHttpUrl(data.published_url)) errors.published_url = ["Published URL tidak valid (awali dengan https://)"];
    }
    return errors;
}

async function findContent(id) {
    const [rows] = await pool.query(
        `SELECT contents.*, channels.platform AS platform, channels.handle_name AS handle_name 
         FROM contents 
         LEFT JOIN channels ON contents.channel_id = channels.id 
         WHERE contents.id = ?`,
        [id]
    );
    return rows[0] ?? null;
}

async function checkChannelAccess(user, channelId) {
    const [rows] = await pool.query("SELECT id, user_id FROM channels WHERE id = ?", [channelId]);
    if (rows.length === 0) return "Channel tidak ditemukan";
    if (user.role !== "admin" && Number(rows[0].user_id) !== Number(user.id)) return "Channel ini bukan milikmu";
    return null;
}

//get all contents
export const getAllContents = async (req, res) => {
    try {
        const conditions = [];
        const params = [];

        // Filter query parameters
        for (const key of ["status", "channel_id", "format_type", "user_id"]) {
            if (req.query[key]) {
                conditions.push(`contents.${key} = ?`);
                params.push(req.query[key]);
            }
        }

        // Filter visibilitas berdasarkan role pengguna login (Admin, Creator, Editor)
        const visibility = visibilityClause(req.user);
        if (visibility.sql) {
            conditions.push(visibility.sql);
            params.push(...visibility.params);
        }

        let query = `
            SELECT contents.*, channels.platform AS platform, channels.handle_name AS handle_name 
            FROM contents 
            LEFT JOIN channels ON contents.channel_id = channels.id
        `;
        if (conditions.length > 0) {
            query += ` WHERE ${conditions.join(" AND ")}`;
        }
        query += " ORDER BY contents.created_at DESC, contents.id DESC";

        const [filteredContents] = await pool.query(query, params);

        // Mengembalikan 200 dengan data array agar frontend tidak crash
        return res.status(200).json({
            status: true,
            data: filteredContents
        });
    } catch (error) {
        return serverError(res, error);
    }
};

//get content by id
export const getContentById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [content] = await pool.query("SELECT * FROM contents INNER JOIN content_checklists ON contents.id = content_checklists.content_id INNER JOIN content_metrics ON contents.id = content_metrics.content_id WHERE contents.id = ?", [id]);
        if (content.length === 0 || content[0].id !== id) {
            return res.status(404).json({
                status: false,
                message: "Content not found"
            });
        }

        // Ambil checklist terkait
        const [checklists] = await pool.query(
            "SELECT id, content_id, task_name, is_completed, created_at FROM content_checklists WHERE content_id = ? ORDER BY id",
            [id]
        );

        // Ambil metric jika pengguna adalah admin
        let metrics = [];
        if (req.user.role === "admin") {
            [metrics] = await pool.query(
                "SELECT id, content_id, recorded_at, views_count, likes_count, comments_count, shares_count, created_at FROM content_metrics WHERE content_id = ? ORDER BY recorded_at DESC, id DESC",
                [id]
            );
        }

        return res.status(200).json({
            status: true,
            data: {
                ...content,
                checklists,
                metrics
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

//create content
export const createContent = async (req, res) => {
    try {
        const body = req.body ?? {};
        const data = {
            channel_id: body.channel_id,
            title: body.title,
            format_type: body.format_type,
            priority: body.priority ?? "medium",
            status: "idea",
        };

        const errors = validateContent(data);
        if (!errors.channel_id) {
            const channelError = await checkChannelAccess(req.user, data.channel_id);
            if (channelError) errors.channel_id = [channelError];
        }
        if (Object.keys(errors).length > 0) {
            return fail(res, 422, "Validation failed", errors);
        }

        const [result] = await pool.query(
            "INSERT INTO contents (user_id, channel_id, title, description, script_draft, format_type, status, priority, scheduled_date) VALUES (?, ?, ?, ?, ?, ?, 'idea', ?, ?)",
            [
                req.user.id, 
                data.channel_id, 
                String(data.title).trim(), 
                body.description || null, 
                body.script_draft || null, 
                data.format_type, 
                data.priority, 
                body.scheduled_date || null
            ]
        );

        const created = await findContent(result.insertId);
        return res.status(201).json({
            status: true,
            message: "Content created successfully",
            data: created
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }

}

//update status content
export const updateContentStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const current = await findContent(id);
        if (!current || !canSeeContent(req.user, current)) return fail(res, 404, "Content not found");

        const body = req.body ?? {};
        const changes = {};
        for (const field of FIELDS_BY_ROLE[req.user.role] ?? []) {
            if (body[field] !== undefined) changes[field] = body[field] === "" ? null : body[field];
        }

        if (changes.status !== undefined && changes.status !== current.status) {
            if (!STATUSES.includes(changes.status)) {
                return fail(res, 422, "Validation failed", { status: ["Status tidak valid"] });
            }
            if (!assignableStatuses(req.user.role).includes(changes.status)) {
                const message = changes.status === "published"
                    ? "Hanya admin yang boleh mempublikasikan konten"
                    : `Role ${req.user.role} tidak boleh mengubah status menjadi "${changes.status}"`;
                return fail(res, 403, message, { status: [message] });
            }
        }

        const merged = { ...current, ...changes };
        const errors = validateContent(merged);
        if (changes.channel_id !== undefined && !errors.channel_id) {
            const channelError = await checkChannelAccess(req.user, changes.channel_id);
            if (channelError) errors.channel_id = [channelError];
        }
        if (Object.keys(errors).length > 0) return fail(res, 422, "Validation failed", errors);

        if (merged.status === "published" && !merged.published_date) changes.published_date = today();

        const fields = Object.keys(changes);
        if (fields.length > 0) {
            const sets = fields.map((field) => `${field} = ?`).join(", ");
            await pool.query(`UPDATE contents SET ${sets}, updated_at = NOW() WHERE id = ?`, [...fields.map((f) => changes[f]), id]);
        }

        const updated = await findContent(id);
        return res.status(200).json({
            status: true,
            message: "Content status updated successfully",
            data: updated
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};


//delete content
export const deleteContent = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const content = await findContent(id);
        if (!content || !canSeeContent(req.user, content)) return fail(res, 404, "Content not found");
        if (!canModifyContent(req.user, content)) return fail(res, 403, "Forbidden");

        await pool.query("DELETE FROM contents WHERE id = ?", [id]);
        return res.status(200).json({
            status: true,
            message: "Content deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

//menambah item checklist pada id
export const addChecklistItem = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const content = await findContent(id);
        if (!content || !canSeeContent(req.user, content)) return fail(res, 404, "Content not found");

        const task_name = String(req.body?.task_name ?? "").trim();
        if (!task_name) return fail(res, 422, "Validation failed", { task_name: ["Nama tugas wajib diisi"] });
        if (task_name.length > 255) return fail(res, 422, "Validation failed", { task_name: ["Nama tugas maksimal 255 karakter"] });

        const [result] = await pool.query("INSERT INTO content_checklists (content_id, task_name) VALUES (?, ?)", [id, task_name]);
        return res.status(201).json({
            status: true,
            message: "Checklist item added successfully",
            data: {
                id: result.insertId,
                content_id: id,
                task_name,
                is_completed: 0
            }
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

//catat log snapshot performa konten
export const snapshotMetrics = async (req, res) => {
    try {
        const content = await findContent(id);
        if (!content) return fail(res, 404, "Content not found");
        if (content.status !== "published") {
            return fail(res, 422, "Metrik hanya bisa dicatat untuk konten yang sudah Published");
        }

        const body = req.body ?? {};
        const recorded_at = body.recorded_at || today();
        const errors = {};
        const counts = {};
        for (const key of ["views_count", "likes_count", "comments_count", "shares_count"]) {
            const value = body[key];
            if (value === undefined || value === null || value === "" || !Number.isInteger(Number(value)) || Number(value) < 0) {
                errors[key] = ["Harus berupa bilangan bulat >= 0"];
            } else {
                counts[key] = Number(value);
            }
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(recorded_at)) errors.recorded_at = ["Format tanggal harus YYYY-MM-DD"];
        if (Object.keys(errors).length > 0) return fail(res, 422, "Validation failed", errors);

        const [result] = await pool.query(
            "INSERT INTO content_metrics (content_id, recorded_at, views_count, likes_count, comments_count, shares_count) VALUES (?, ?, ?, ?, ?, ?)",
            [id, recorded_at, counts.views_count, counts.likes_count, counts.comments_count, counts.shares_count]
        );

        return res.status(201).json({
            status: true,
            message: "Metrics successfully recorded",
            data: {
                id: result.insertId,
                content_id: id,
                recorded_at,
                ...counts
            }
        })

    } catch(error) {
        return res.status(500).json({
            status: false,
            message: error.message
        })
    }
}