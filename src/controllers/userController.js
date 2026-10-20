import pool from "../config/db.js";
import bcrypt from "bcrypt";

//get all users
export const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.query("SELECT id, name, email, role FROM users");
        return res.status(200).json({
            status: true,
            message: "Users retrieved successfully",
            data: users
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

//get user by id
export const getUserById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        //cek apakah ada user dengan id tersebut
        const [existingUser] = await pool.query("SELECT id, name, email, role FROM users WHERE id = ?", [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }
        return res.status(200).json({
            status: true,
            message: "User retrieved successfully",
            data: existingUser[0]
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

//create user
export const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
        //cek apakah email sudah ada di database
        const [existingUser] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (existingUser.length > 0) {
            return res.status(409).json({
                status: false,
                message: "Email already taken"
            });
        }
        
        //cek apakah semua field sudah diisi
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        }
        //hash password sebelum disimpan ke database
        const password_hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)", [name, email, password_hash, role]);
        return res.status(201).json({
            status: true,
            message: "User created successfully",
            data: { id: result.insertId, name, email, role }
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }

};

//update user
export const updateUser = async (req, res) => {
    const id = parseInt(req.params.id);
    const { name, email, password, role } = req.body;

    try {
        //cek apakah user dengan id tersebut ada
        const [existingUser] = await pool.query("SELECT id FROM users WHERE id = ?", [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        //cek apakah password kosong, jika kosong, password tidak diupdate, jika tidak kosong, password dihash dan diupdate
        if (!password) {
            const [user] = await pool.query("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?", [name, email, role, id]);
        } else {
            const password_hash = await bcrypt.hash(password, 12);
            const [user] = await pool.query("UPDATE users SET name = ?, email = ?, password_hash = ?, role = ? WHERE id = ?", [name, email, password_hash, role, id]);
        }

        return res.status(200).json({
            status: true,
            message: "User updated successfully",
            data: { id, name, email, role }
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

//delete user
export const deleteUser = async (req, res) => {
    const id = parseInt(req.params.id);
    try {
        //cek apakah user dengan id tersebut ada
        const [existingUser] = await pool.query("SELECT id FROM users WHERE id = ?", [id]);
        if (existingUser.length === 0) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }
        await pool.query("DELETE FROM users WHERE id = ?", [id]);
        return res.status(200).json({
            status: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};
