import pool from "../config/db.js";
import bcrypt from "bcrypt";
import { createUserSchema, updateUserSchema, validate } from "../validation/auth.validation.js";

const fail = (res, status, message, errors) =>
    res.status(status).json({ status: false, message, ...(errors && { errors }) });

const serverError = (res, error) => {
    console.error(error);
    return fail(res, 500, "Internal Server Error");
};

const adminCount = async () => {
    const [rows] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");
    return rows[0].total;
};

//get all users (admin)
export const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query("SELECT id, name, email, role, created_at FROM users ORDER BY id");
        return res.status(200).json({ status: true, message: "Users retrieved successfully", data: users });
    } catch (error) {
        return serverError(res, error);
    }
};

//get user by id (admin atau pemilik akun)
export const getUserById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (req.user.role !== "admin" && req.user.id !== id) {
            return fail(res, 403, "Forbidden");
        }
        const [rows] = await pool.query("SELECT id, name, email, role, created_at FROM users WHERE id = ?", [id]);
        if (rows.length === 0) return fail(res, 404, "User not found");
        return res.status(200).json({ status: true, message: "User retrieved successfully", data: rows[0] });
    } catch (error) {
        return serverError(res, error);
    }
};

//create user (admin): role boleh diisi bebas
export const createUser = async (req, res) => {
    try {
        const body = req.body ?? {};
        const errors = validate(createUserSchema, body);
        if (errors) return fail(res, 422, "Validation failed", errors);

        const name = body.name.trim();
        const email = body.email.trim();
        const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) return fail(res, 409, "Email already taken");

        const password_hash = await bcrypt.hash(body.password, 10);
        const [result] = await pool.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [name, email, password_hash, body.role]
        );
        return res.status(201).json({
            status: true,
            message: "User created successfully",
            data: { id: result.insertId, name, email, role: body.role }
        });
    } catch (error) {
        return serverError(res, error);
    }
};

//update user: admin boleh semua; user biasa hanya akunnya sendiri dan TIDAK boleh mengubah role
export const updateUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const isAdmin = req.user.role === "admin";
        if (!isAdmin && req.user.id !== id) return fail(res, 403, "Forbidden");

        const [rows] = await pool.query("SELECT id, name, email, role FROM users WHERE id = ?", [id]);
        if (rows.length === 0) return fail(res, 404, "User not found");
        const current = rows[0];

        const body = req.body ?? {};
        const next = {
            name: body.name ?? current.name,
            email: body.email ?? current.email,
            role: isAdmin ? (body.role ?? current.role) : current.role,
        };
        if (body.password) next.password = body.password;

        const errors = validate(updateUserSchema, next);
        if (errors) return fail(res, 422, "Validation failed", errors);

        if (current.role === "admin" && next.role !== "admin" && (await adminCount()) <= 1) {
            return fail(res, 409, "Minimal harus ada satu admin");
        }
        const [dupe] = await pool.query("SELECT id FROM users WHERE email = ? AND id <> ?", [next.email.trim(), id]);
        if (dupe.length > 0) return fail(res, 409, "Email already taken");

        const name = next.name.trim();
        const email = next.email.trim();
        if (next.password) {
            const password_hash = await bcrypt.hash(next.password, 12);
            await pool.query("UPDATE users SET name = ?, email = ?, password_hash = ?, role = ? WHERE id = ?", [name, email, password_hash, next.role, id]);
        } else {
            await pool.query("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?", [name, email, next.role, id]);
        }

        return res.status(200).json({
            status: true,
            message: "User updated successfully",
            data: { id, name, email, role: next.role }
        });
    } catch (error) {
        return serverError(res, error);
    }
};

//delete user (admin). Channel dan konten milik user ikut terhapus (ON DELETE CASCADE)
export const deleteUser = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (req.user.id === id) return fail(res, 409, "Tidak bisa menghapus akun sendiri");

        const [rows] = await pool.query("SELECT id, role FROM users WHERE id = ?", [id]);
        if (rows.length === 0) return fail(res, 404, "User not found");
        if (rows[0].role === "admin" && (await adminCount()) <= 1) {
            return fail(res, 409, "Minimal harus ada satu admin");
        }

        await pool.query("DELETE FROM users WHERE id = ?", [id]);
        return res.status(200).json({ status: true, message: "User deleted successfully" });
    } catch (error) {
        return serverError(res, error);
    }
};
