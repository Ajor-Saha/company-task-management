import { z } from "zod";

export const projectFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().min(1, "Description is required"),
    budget: z.number().min(1, "Budget must be a positive number"),
  });
  