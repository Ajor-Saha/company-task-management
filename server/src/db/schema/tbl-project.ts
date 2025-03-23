import { relations, sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { companyTable } from "./tbl-company";
// Import join table and task table for additional relations
import { projectAssignmentsTable } from "./tbl-project-assignments";
import { taskTable } from "./tbl-task";

export const projectStatusEnum = pgEnum("project_status", [
  "to-do",
  "hold",
  "review",
  "completed",
]);

export const projectTable = pgTable("tbl_project", {
  id: text("id").notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  budget: integer("budget"),
  status: projectStatusEnum("status").default("to-do"),
  companyId: text("company_id")
    .references(() => companyTable.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});

export const projectsRelations = relations(projectTable, ({ one, many }) => ({
  company: one(companyTable, {
    fields: [projectTable.companyId],
    references: [companyTable.id],
  }),
  // Many-to-many: A project can have many assigned employees (users) via the join table
  assignedEmployees: many(projectAssignmentsTable),
  // A project can have many tasks
  tasks: many(taskTable),
}));
