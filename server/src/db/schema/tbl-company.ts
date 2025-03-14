import { relations, sql } from "drizzle-orm";
import { pgTable, serial, text, varchar, boolean, json, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { userTable } from "./tbl-user";
import { projectTable } from "./tbl-project";



export const companyTable = pgTable("tbl_company", {
  id: text("id").notNull().primaryKey(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  description: text("description"), // Text type for the password field
  category: varchar("category", { length: 50 }).notNull(),
  address: json("address"),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
          .default(sql`current_timestamp`)
          .$onUpdate(() => new Date()),
});


export const companyRelations = relations(companyTable, ({ many }) => ({
    users: many(userTable),
    projects: many(projectTable),
  }));
  