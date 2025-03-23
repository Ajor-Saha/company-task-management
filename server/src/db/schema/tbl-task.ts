import { relations, sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { projectTable } from "./tbl-project";
import { userTable } from "./tbl-user";

// Define the task status enum
export const taskStatusEnum = pgEnum("task_status", [
    "to-do",
    "hold",
    "review",
    "completed",
  ]);
  

export const taskTable = pgTable("tbl_task", {
  id: text("id").notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  budget: integer("budget"),
  status: taskStatusEnum("status").default("to-do"),
  projectId: text("project_id")
    .references(() => projectTable.id, { onDelete: "cascade" })
    .notNull(),
  assignedTo: text("assigned_to")
    .references(() => userTable.userId, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});

export const tasksRelations = relations(taskTable, ({ one }) => ({
  project: one(projectTable, {
    fields: [taskTable.projectId],
    references: [projectTable.id],
  }),
  // Each task is assigned to one user
  assignedUser: one(userTable, {
    fields: [taskTable.assignedTo],
    references: [userTable.userId],
  }),
}));
