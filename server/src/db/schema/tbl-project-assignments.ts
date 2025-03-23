import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { userTable } from "./tbl-user";
import { projectTable } from "./tbl-project";

export const projectAssignmentsTable = pgTable("tbl_project_assignments", {
  projectId: text("project_id")
    .notNull()
    .references(() => projectTable.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => userTable.userId, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
});

export const projectAssignmentsRelations = relations(
  projectAssignmentsTable,
  ({ one }) => ({
    project: one(projectTable, {
      fields: [projectAssignmentsTable.projectId],
      references: [projectTable.id],
    }),
    user: one(userTable, {
      fields: [projectAssignmentsTable.userId],
      references: [userTable.userId],
    }),
  })
);
