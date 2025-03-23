import { z } from "zod";

// Zod schema for signup
export const signupSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "firstName must be at least 2 characters" }),
  lastName: z
    .string()
    .min(2, { message: "lastName must be at least 2 characters" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
  companyId: z.string().min(5, { message: "companyId must be at least 5 characters" }),
});
// Zod schema for login
export const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters" }),
});
// Zod schema for verifySchema
export const verifySchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  code: z.string().length(6, { message: "Code must be 6 characters" }),
});