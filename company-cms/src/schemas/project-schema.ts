import { z } from "zod";

export const projectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  budget: z.number().min(1, "Budget must be a positive number"),
});

export const editProjectFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  budget: z
    .string()
    .min(1, "Budget is required")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Budget must be a positive number",
    }),
  startDate: z
    .string()
    .min(1, "Start date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid start date",
    }),
  endDate: z
    .string()
    .min(1, "End date is required")
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid end date",
    }),
});
