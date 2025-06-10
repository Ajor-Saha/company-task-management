import * as z from "zod";

export const formSchema = z.object({
  firstName: z.string()
    .min(1, "First name is required")
    .max(255, "First name must be less than 255 characters"),
  lastName: z.string()
    .min(1, "Last name is required")
    .max(255, "Last name must be less than 255 characters"),
  email: z.string()
    .email("Invalid email address")
    .min(1, "Email is required"),
  avatar: z.any().refine((file) => file instanceof File && file.size > 0, {
    message: "Please upload a valid image file.",
  }),
});