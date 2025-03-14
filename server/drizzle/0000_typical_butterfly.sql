CREATE TYPE "public"."role" AS ENUM('admin', 'senior_employee', 'assigned_employee');--> statement-breakpoint
CREATE TABLE "tbl_user" (
	"user_id" text PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255),
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"avatar" text,
	"role" "role" NOT NULL,
	"verify_code" text,
	"verify_code_expiry" timestamp,
	"is_verified" boolean DEFAULT false,
	"company_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp,
	CONSTRAINT "tbl_user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "tbl_company" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"category" varchar(50) NOT NULL,
	"address" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp,
	CONSTRAINT "tbl_company_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tbl_project" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"budget" integer,
	"status" varchar(100) DEFAULT 'To-Do',
	"company_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
ALTER TABLE "tbl_user" ADD CONSTRAINT "tbl_user_company_id_tbl_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."tbl_company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_project" ADD CONSTRAINT "tbl_project_company_id_tbl_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."tbl_company"("id") ON DELETE cascade ON UPDATE no action;