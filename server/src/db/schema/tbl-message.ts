import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  integer,
  pgEnum,
} from "drizzle-orm/pg-core";
import { projectTable } from "./tbl-project";
import { userTable } from "./tbl-user";

export const messageTable = pgTable("tbl_message", {
  id: text("id").notNull().primaryKey(),
  content: varchar("content", { length: 1000 }).notNull(),
  senderId: text("sender_id")
    .references(() => userTable.userId, { onDelete: "cascade" })
    .notNull(),
  projectId: text("project_id")
    .references(() => projectTable.id, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});

export const messagesRelations = relations(messageTable, ({ one }) => ({
  project: one(projectTable, {
    fields: [messageTable.projectId],
    references: [projectTable.id],
  }),
  sender: one(userTable, {
    fields: [messageTable.senderId],
    references: [userTable.userId],
  }),
}));
