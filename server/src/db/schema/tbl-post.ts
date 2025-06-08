import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";
import { userTable } from "./tbl-user";
import { companyTable } from "./tbl-company";
import { Mention, PostFile } from "../../types/common";



export const postTable = pgTable("tbl_post", {
  id: text("id").notNull().primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  userId: text("user_id")
    .references(() => userTable.userId, { onDelete: "cascade" })
    .notNull(),
  companyId: text("company_id")
    .references(() => companyTable.id, { onDelete: "cascade" })
    .notNull(),
  files: jsonb("files").$type<PostFile[]>().default([]),
  mention: jsonb("mention").$type<Mention[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});

export const postRelations = relations(postTable, ({ one }) => ({
  user: one(userTable, {
    fields: [postTable.userId],
    references: [userTable.userId],
  }),
  company: one(companyTable, {
    fields: [postTable.companyId],
    references: [companyTable.id],
  }),
}));


