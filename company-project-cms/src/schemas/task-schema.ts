import { z } from "zod";

export const taskSchema = z.object({
  name: z.string().min(3, { message: "Task name must be at least 3 characters" }),
  description: z.string().min(5, { message: "Description must be at least 5 characters" }),
  dueDate: z.string().optional(),
});
