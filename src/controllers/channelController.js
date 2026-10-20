import pool from "../config/db.js";

//get all channels
export const getAllChannels = async (req, res) => {
    try {
        const [existingChannels] = await pool.query("SELECT * FROM channels");
        if (existingChannels.length === 0) {
            return res.status(404).json({
                status: false,
                message: "No channels found"
            });
        }
        const [channels] = await pool.query("SELECT id, user_id, platform, handle_name, created_at FROM channels");
        return res.status(200).json({
            status: true,
            message: "Channels retrieved successfully",
            data: channels
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

//get channel by id
export const getChannelById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [channel] = await pool.query("SELECT * FROM channels WHERE id = ?", [id]);
        if (channel.length === 0) {
            return res.status(404).json({
                status: false,
                message: "Channel not found"
            });
        }
        return res.status(200).json({
            status: true,
            message: "Channel retrieved successfully",
            data: channel
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

//create channel
export const createChannel = async (req, res) => {
    const { user_id, platform, handle_name } = req.body;
    //cek apakah user_id ada di tabel users
    const [existingUser] = await pool.query("SELECT id FROM users WHERE id = ?", [user_id]);
    if (existingUser.length === 0) {
        return res.status(404).json({
            status: false,
            message: "User not found"
        });
    }
    try {
        if (!user_id || !platform || !handle_name) {
            return res.status(400).json({
                status: false,
                message: "user_id, platform, and handle_name are required"
            });
        }
        const [channel] = await pool.query("INSERT INTO channels (user_id, platform, handle_name) VALUES (?, ?, ?)", [user_id, platform, handle_name]);
        return res.status(201).json({
            status: true,
            message: "Channel created successfully",
            data: {
                id: channel.insertId,
                user_id,
                platform,
                handle_name
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

//update channel
export const updateChannel = async (req, res) => {
    const id = parseInt(req.params.id);
    const { user_id, platform, handle_name } = req.body;
    try {
        const [existingChannel] = await pool.query("SELECT id FROM channels WHERE id = ?", [id]);
        if (existingChannel.length === 0 || existingChannel[0].id !== id) {
            return res.status(404).json({
                status: false,
                message: "Channel not found"
            });
        }
        await pool.query("UPDATE channels SET user_id = ?, platform = ?, handle_name = ? WHERE id = ?", [user_id, platform, handle_name, id]);
        return res.status(200).json({
            status: true,
            message: "Channel updated successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

//delete channel
export const deleteChannel = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const [existingChannel] = await pool.query("SELECT id FROM channels WHERE id = ?", [id]);
        if (existingChannel.length === 0 || existingChannel[0].id !== id) {
            return res.status(404).json({
                status: false,
                message: "Channel not found"
            });
        }
        await pool.query("DELETE FROM channels WHERE id = ?", [id]);
        return res.status(200).json({
            status: true,
            message: "Channel deleted successfully"
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}