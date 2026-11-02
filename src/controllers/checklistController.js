import pool from "../config/db.js";
import { canSeeContent } from "../utils/permissions.js";

const fail = (res, status, message) => res.status(status).json({ status: false, message });

// Memuat checklist beserta konten induknya; hanya lolos jika konten itu boleh dilihat user.
async function findAccessibleChecklist(id, user) {
    const [rows] = await pool.query(
        `SELECT cl.id, cl.is_completed, c.user_id, c.status
         FROM content_checklists cl
         JOIN contents c ON c.id = cl.content_id
         WHERE cl.id = ?`,
        [id]
    );
    if (rows.length === 0) return null;
    return canSeeContent(user, { user_id: rows[0].user_id, status: rows[0].status }) ? rows[0] : null;
}

//toggle status checklist item: nilai dibalik di database 
export const toggleChecklistItemStatus = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const item = await findAccessibleChecklist(id, req.user);
        if (!item) return fail(res, 404, "Checklist item not found");

        await pool.query("UPDATE content_checklists SET is_completed = 1 - is_completed WHERE id = ?", [id]);
        const [rows] = await pool.query("SELECT id, is_completed FROM content_checklists WHERE id = ?", [id]);
        return res.status(200).json({
            status: true,
            message: "Checklist item status updated successfully",
            updated_to: rows[0].is_completed,
            data: rows[0]
        });
    } catch (error) {
        console.error(error);
        return fail(res, 500, "Internal Server Error");
    }
};

//hapus checklist item
export const deleteChecklistItem = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const item = await findAccessibleChecklist(id, req.user);
        if (!item) return fail(res, 404, "Checklist item not found");

        await pool.query("DELETE FROM content_checklists WHERE id = ?", [id]);
        return res.status(200).json({ status: true, message: "Checklist item deleted successfully" });
    } catch (error) {
        console.error(error);
        return fail(res, 500, "Internal Server Error");
    }
};
