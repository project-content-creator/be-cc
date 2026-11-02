import jwt from "jsonwebtoken"
import pool from "../config/db.js"

// Memeriksa token JWT lalu memuat data user TERBARU dari database,
// sehingga perubahan role atau penghapusan akun langsung berlaku.
export const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ status: false, message: "Unauthorized" })
    }
    const token = authHeader.slice(7).trim()

    let decoded
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch {
        return res.status(401).json({ status: false, message: "Invalid or expired token" })
    }

    try {
        const [rows] = await pool.query("SELECT id, name, email, role FROM users WHERE id = ?", [decoded.id])
        if (rows.length === 0) {
            return res.status(401).json({ status: false, message: "Account no longer exists" })
        }
        req.user = rows[0]
        next()
    } catch (error) {
        next(error)
    }
}

// Contoh: router.post("/", requireRole("admin", "creator"), handler)
export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ status: false, message: "Forbidden: role kamu tidak punya akses ke fitur ini" })
    }
    next()
}
