import pool from "../config/db.js";
import { PLATFORMS } from "../utils/permissions.js";

const fail = (res, status, message, errors) =>
    res.status(status).json({ status: false, message, ...(errors && { errors }) });

const serverError = (res, error) => {
    console.error(error);
    return fail(res, 500, "Internal Server Error");
};

const SELECT_CHANNEL = `
    SELECT ch.id, ch.user_id, ch.platform, ch.handle_name, ch.created_at,
           u.name AS owner_name,
           (SELECT COUNT(*) FROM contents c WHERE c.channel_id = ch.id) AS contents_count
    FROM channels ch
    LEFT JOIN users u ON u.id = ch.user_id`;

function validateChannel(body) {
    const errors = {};
    const handle = typeof body.handle_name === "string" ? body.handle_name.trim() : "";
    if (!PLATFORMS.includes(body.platform)) errors.platform = ["Platform tidak valid"];
    if (!handle) errors.handle_name = ["Handle wajib diisi"];
    else if (handle.length > 100) errors.handle_name = ["Handle maksimal 100 karakter"];
    return { errors: Object.keys(errors).length ? errors : null, handle };
}

const canManage = (user, channel) =>
    user.role === "admin" || (user.role === "creator" && Number(channel.user_id) === Number(user.id));

//get all channels: semua role boleh melihat semua channel
export const getAllChannels = async (req, res) => {
    try {
        const [channels] = await pool.query(`${SELECT_CHANNEL} ORDER BY ch.id`);
        return res.status(200).json({ status: true, message: "Channels retrieved successfully", data: channels });
    } catch (error) {
        return serverError(res, error);
    }
};

//get channel by id
export const getChannelById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [rows] = await pool.query(`${SELECT_CHANNEL} WHERE ch.id = ?`, [id]);
        if (rows.length === 0) return fail(res, 404, "Channel not found");
        return res.status(200).json({ status: true, message: "Channel retrieved successfully", data: rows[0] });
    } catch (error) {
        return serverError(res, error);
    }
};

//create channel: pemilik = user yang login
export const createChannel = async (req, res) => {
    try {
        const body = req.body ?? {};
        const { errors, handle } = validateChannel(body);
        if (errors) return fail(res, 422, "Validation failed", errors);

        const [result] = await pool.query(
            "INSERT INTO channels (user_id, platform, handle_name) VALUES (?, ?, ?)",
            [req.user.id, body.platform, handle]
        );
        return res.status(201).json({
            status: true,
            message: "Channel created successfully",
            data: { id: result.insertId, user_id: req.user.id, platform: body.platform, handle_name: handle }
        });
    } catch (error) {
        return serverError(res, error);
    }
};

//update channel: admin atau pemilik
export const updateChannel = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [rows] = await pool.query("SELECT id, user_id FROM channels WHERE id = ?", [id]);
        if (rows.length === 0) return fail(res, 404, "Channel not found");
        if (!canManage(req.user, rows[0])) return fail(res, 403, "Forbidden: bukan channel milikmu");

        const body = req.body ?? {};
        const { errors, handle } = validateChannel(body);
        if (errors) return fail(res, 422, "Validation failed", errors);

        await pool.query("UPDATE channels SET platform = ?, handle_name = ? WHERE id = ?", [body.platform, handle, id]);
        return res.status(200).json({
            status: true,
            message: "Channel updated successfully",
            data: { id, user_id: rows[0].user_id, platform: body.platform, handle_name: handle }
        });
    } catch (error) {
        return serverError(res, error);
    }
};

//delete channel: admin atau pemilik. Konten di channel ini ikut terhapus (ON DELETE CASCADE)
export const deleteChannel = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [rows] = await pool.query("SELECT id, user_id FROM channels WHERE id = ?", [id]);
        if (rows.length === 0) return fail(res, 404, "Channel not found");
        if (!canManage(req.user, rows[0])) return fail(res, 403, "Forbidden: bukan channel milikmu");

        await pool.query("DELETE FROM channels WHERE id = ?", [id]);
        return res.status(200).json({ status: true, message: "Channel deleted successfully" });
    } catch (error) {
        return serverError(res, error);
    }
};
