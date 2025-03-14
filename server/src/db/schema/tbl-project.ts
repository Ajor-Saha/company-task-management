import { relations, sql } from "drizzle-orm";
import { pgTable, serial, text, varchar, boolean, json, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { companyTable } from "./tbl-company";



export const projectTable = pgTable("tbl_project", {
  id: text("id").notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"), // Text type for the password field
  budget: integer("budget"),
  status: varchar("status", { length: 100 }).default("To-Do"),
  companyId: text("company_id").references(() => companyTable.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
          .default(sql`current_timestamp`)
          .$onUpdate(() => new Date()),
});


export const projectsRelations = relations(projectTable, ({ one }) => ({
    company: one(companyTable, {
      fields: [projectTable.companyId],
      references: [companyTable.id],
    }),
}));
  