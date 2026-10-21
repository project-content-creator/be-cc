import pool from "../config/db.js";

//get all contents
export const getAllContents = async (req, res) => {
    try {
        //ambil query params untuk filter status dan channel_id
        const { status, channel_id } = req.query;

        //define query dasar
        let query = "SELECT * FROM contents";
        let queryParams = [];

        //susun query berdasarkan filter
        if (status && channel_id) {
            query += " WHERE status = ? AND channel_id = ?";
            queryParams = [status, channel_id];
        }
        else if (status) {
            query += " WHERE status = ?";
            queryParams = [status];
        }
        else if (channel_id) {
            query += " WHERE channel_id = ?";
            queryParams = [channel_id];
        }

        //ambil data dari database
        const [filteredContents] = await pool.query(query, queryParams);

        //validasi hasil query
        if (filteredContents.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No contents found with the specified filters"
            });
        }

        //tampilkan hasil query
        return res.status(200).json({
            status: true,
            data: filteredContents
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
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
        return res.status(200).json({
            status: true,
            data: content
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
        const {user_id, channel_id, title, description, script_draft, format_type, status, priority, scheduled_date, published_date, published_url} = req.body
        if (!user_id || !channel_id || !title || !description || !script_draft || !format_type || !status || !priority) {
            return res.status(400).json({
                status: false,
                message: "Missing required fields"
            });
        }
    
        const [content] = await pool.query("INSERT INTO contents (user_id, channel_id, title, description, script_draft, format_type, status, priority, scheduled_date, published_date, published_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [user_id, channel_id, title, description, script_draft, format_type, status, priority, scheduled_date || null, published_date || null, published_url || null]);
    
        return res.status(201).json({
            status: true,
            message: "Content created successfully",
            data: {
                id: content.insertId,
                user_id,
                channel_id,
                title,
                description,
                script_draft,
                format_type,
                status,
                priority,
                scheduled_date,
                published_date,
                published_url
            }
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
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({
                status: false,
                message: "Missing required field: status"
            });
        }
        await pool.query("UPDATE contents SET status = ? WHERE id = ?", [status, id]);
        return res.status(200).json({
            status: true,
            message: "Content status updated successfully"
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
        const [existingContent] = await pool.query("SELECT id FROM contents WHERE id = ?", [id]);
        if (existingContent.length === 0 || existingContent[0].id !== id) {
            return res.status(404).json({
                status: false,
                message: "Content not found"
            });
        }
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
