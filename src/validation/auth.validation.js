import Joi from "joi";

export const loginSchema = Joi.object({
    email: Joi.string().trim().email().required(),
    password: Joi.string().min(8).required()
})