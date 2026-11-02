import Joi from "joi";
import { ROLES } from "../utils/permissions.js";

export const loginSchema = Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).required()
})

// Pesan error berbahasa Indonesia untuk semua skema.
const messages = {
    "any.required": "{#label} wajib diisi",
    "string.empty": "{#label} wajib diisi",
    "string.base": "{#label} harus berupa teks",
    "string.email": "Format email tidak valid",
    "string.min": "{#label} minimal {#limit} karakter",
    "string.max": "{#label} maksimal {#limit} karakter",
    "any.only": "{#label} tidak valid",
};

const name = Joi.string().trim().min(1).max(100).label("Nama lengkap");
const email = Joi.string().trim().email().max(191).label("Email");
// bcrypt hanya memakai 72 byte pertama password, jadi dibatasi 72 karakter.
const password = Joi.string().min(8).max(72).label("Password");

export const registerSchema = Joi.object({
    name: name.required(),
    email: email.required(),
    password: password.required(),
}).unknown(true); // field lain (mis. role) diabaikan: akun baru selalu "creator"

export const createUserSchema = Joi.object({
    name: name.required(),
    email: email.required(),
    password: password.required(),
    role: Joi.string().valid(...ROLES).required().label("Role"),
});

export const updateUserSchema = Joi.object({
    name: name.required(),
    email: email.required(),
    password: password.optional(),
    role: Joi.string().valid(...ROLES).required().label("Role"),
});

// Hasil: null jika valid, atau { field: ["pesan"] } jika tidak.
export function validate(schema, data) {
    const { error } = schema.validate(data, { abortEarly: false, messages });
    if (!error) return null;
    return error.details.reduce((acc, detail) => {
        const key = detail.path[0] ?? "body";
        (acc[key] ??= []).push(detail.message);
        return acc;
    }, {});
}
