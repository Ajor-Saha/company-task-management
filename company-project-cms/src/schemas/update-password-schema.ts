import { z } from "zod";
export const passwordSchema = z
  .object({
    current: z
      .string()
      .min(8, "Current password must be at least 8 characters long"),
    new: z.string().min(8, "New password must be at least 8 characters long"),
    confirmPassword: z
      .string()
      .min(8, "Confirm password must be at least 8 characters long"),
  })
  .refine((data) => data.new === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"], // This is the field where the error will be shown
  });
