CREATE TABLE "tbl_post" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"user_id" text NOT NULL,
	"company_id" text NOT NULL,
	"files" jsonb DEFAULT '[]'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
ALTER TABLE "tbl_post" ADD CONSTRAINT "tbl_post_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_post" ADD CONSTRAINT "tbl_post_company_id_tbl_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."tbl_company"("id") ON DELETE cascade ON UPDATE no action;