import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt"
import pool from "../config/db.js";
import { registerSchema, validate } from "../validation/auth.validation.js";

const fail = (res, status, message, errors) =>
    res.status(status).json({ status: false, message, ...(errors && { errors }) });

export const login = async(req, res) => {
try {
   const { email, password } = req.body;

   if (!email || !password) {
    return res.status(400).json({
        status: false,
        message: "Email and password required",
    });
   }

   const [user] = await pool.query("SELECT id, name, email, password_hash, role FROM users WHERE email =?", [email])

   if (user.length === 0) {
    return res.status(401).json({
        status: false,
        message: "Invalid credential"
        })
    }
    const dataUser = user[0];
    const isMatch = await bcrypt.compare(password, dataUser.password_hash);

    if (!isMatch) {
    return res.status(401).json({
      status: false,
      message: "Invalid credential", //401:unauthorized /login gagal
        });
    }
    const token = jwt.sign(
    {
    id: dataUser.id,
    name: dataUser.name,
    email: dataUser.email,
    role: dataUser.role
    }, 
    process.env.JWT_SECRET,
    {expiresIn: process.env.JWT_EXPIRES_IN || '1D'},
    )
    return res.status(200).json({
        status: true,
        message: "Login success",
        data: {
            user: {
            id: dataUser.id,
            name: dataUser.name,
            email: dataUser.email,
            role: dataUser.role
      },
      token,
    },
  });
} catch (error) {
    // Tambahkan try-catch agar jika database error, aplikasinya tidak langsung mati/crash
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal Server Error",
      error: error.message
    });
  }
};

export const register = async(req, res) => {
  try {
    const body = req.body ?? {};
    const errors = validate(registerSchema, body);
    if (errors) return fail(res, 422, "Validation failed", errors);

    const name = body.name.trim();
    const email = body.email.trim();

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
        const [result] = await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'creator')", [name, email, password_hash]);
        return res.status(201).json({
            status: true,
            message: "User created successfully",
            data: { id: result.insertId, name, email, role: "creator" }
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
}

export const me = async (req, res) => {
  return res.status(200).json({ status: true, data: req.user });
}