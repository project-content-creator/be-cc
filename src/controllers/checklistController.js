import pool from "../config/db.js";

//toggle status checklist item
export const toggleChecklistItemStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const raw_completed = parseInt(req.body.is_completed);
        
        
        //validasi input payload
        if (raw_completed === undefined || raw_completed === null || isNaN(raw_completed)) {
            return res.status(400).json({
                status: false,
                message: "Missing required field: is_completed"
            });
        }

        let is_completed = parseInt(raw_completed);
        
        //toggle is_completed
        is_completed = is_completed === 0 ? 1 : 0;

        //cek apakah checklist item ada di database
        const [existingItem] = await pool.query("SELECT id FROM content_checklists WHERE id = ?", [id]);
        if (existingItem.length === 0) {
            return res.status(404).json({
                status: false,
                message: "Checklist item not found"
            });
        }
        //update status checklist item
        await pool.query("UPDATE content_checklists SET is_completed = ? WHERE id = ?", [is_completed, id]);
        return res.status(200).json({
            status: true,
            message: "Checklist item status updated successfully",
            updated_to: is_completed
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            error: error.message
        });
    }
};