import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
} from "drizzle-orm/pg-core";
import { userTable } from "./tbl-user";

export const botMessageTable = pgTable("tbl_bot_message", {
  id: text("id").notNull().primaryKey(),
  userMessage: text("user_message").notNull(),
  botMessage: text("bot_message").notNull(),
  userId: text("user_id")
    .references(() => userTable.userId, { onDelete: "cascade" })
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .default(sql`current_timestamp`)
    .$onUpdate(() => new Date()),
});

export const botMessagesRelations = relations(botMessageTable, ({ one }) => ({
  user: one(userTable, {
    fields: [botMessageTable.userId],
    references: [userTable.userId],
  }),
})); 