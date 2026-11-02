import jwt from 'jsonwebtoken';
import bcrypt from "bcrypt"
import pool from "../config/db.js";
import { registerSchema, validate } from "../validation/auth.validation.js";

const fail = (res, status, message, errors) =>
    res.status(status).json({ status: false, message, ...(errors && { errors }) });

export const login = async(req, res) => {
try {
   const { email, password } = req.body ?? {};

   if (!email || !password) {
    return fail(res, 400, "Email and password required");
   }

   const [user] = await pool.query("SELECT id, name, email, password_hash, role FROM users WHERE email = ?", [email])

   if (user.length === 0) {
    return fail(res, 401, "Invalid credential");
    }
    const dataUser = user[0];
    const isMatch = await bcrypt.compare(password, dataUser.password_hash);

    if (!isMatch) {
      return fail(res, 401, "Invalid credential"); //401:unauthorized /login gagal
    }
    const token = jwt.sign(
    {
    id: dataUser.id,
    name: dataUser.name,
    email: dataUser.email,
<<<<<<< HEAD
    role: dataUser.role,
    },
=======
    role: dataUser.role
    }, 
>>>>>>> 6a66ee81024269227810225b8fa1a3209dac728f
    process.env.JWT_SECRET,
    {expiresIn: process.env.JWT_EXPIRES_IN || '1d'},
    )
    return res.status(200).json({
        status: true,
        message: "Login success",
        data: {
            user: {
            id: dataUser.id,
            name: dataUser.name,
            email: dataUser.email,
<<<<<<< HEAD
            role: dataUser.role,
=======
            role: dataUser.role
>>>>>>> 6a66ee81024269227810225b8fa1a3209dac728f
      },
      token,
    },
  });
} catch (error) {
    console.error(error);
    return fail(res, 500, "Internal Server Error");
  }
};

// Pendaftaran publik: role SELALU "creator". Admin/editor dibuat oleh admin lewat POST /user.
export const register = async(req, res) => {
  try {
    const body = req.body ?? {};
    const errors = validate(registerSchema, body);
    if (errors) return fail(res, 422, "Validation failed", errors);

    const name = body.name.trim();
    const email = body.email.trim();

    const [existingUser] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return fail(res, 409, "Email already taken");
    }

    const password_hash = await bcrypt.hash(body.password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'creator')",
      [name, email, password_hash]
    );
    return res.status(201).json({
      status: true,
      message: "User registered successfully",
      data: { id: result.insertId, name, email, role: "creator" }
    });
  } catch (error) {
    console.error(error);
    return fail(res, 500, "Internal Server Error");
  }
}

// Data user yang sedang login (dipakai frontend untuk menyegarkan role)
export const me = async (req, res) => {
  return res.status(200).json({ status: true, data: req.user });
}
