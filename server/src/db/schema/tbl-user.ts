import { relations, sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  boolean,
  timestamp,
  pgEnum,
  integer,
} from "drizzle-orm/pg-core";
import { companyTable } from "./tbl-company";
import { projectAssignmentsTable } from "./tbl-project-assignments";

export const roleEnum = pgEnum("role", [
  "admin",
  "senior_employee",
  "assigned_employee",
]);

export const userTable = pgTable("tbl_user", {
  userId: text("user_id").notNull().primaryKey(),
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  avatar: text("avatar"),
  salary: text("salary"),
  role: roleEnum("role").notNull(),
  verifyCode: text("verify_code"),
  verifyCodeExpiry: timestamp("verify_code_expiry"),
  isVerified: boolean("is_verified").default(false),
  companyId: text("company_id").references(() => companyTable.id, { onDelete: "cascade" }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").default(sql`current_timestamp`).$onUpdate(() => new Date()),
});

export const usersRelations = relations(userTable, ({ one, many }) => ({
  company: one(companyTable, {
    fields: [userTable.companyId],
    references: [companyTable.id],
  }),
  // Users may be assigned to many projects via the join table
  assignedProjects: many(projectAssignmentsTable),
}));
