CREATE TABLE "tbl_message" (
	"id" text PRIMARY KEY NOT NULL,
	"content" varchar(1000) NOT NULL,
	"sender_id" text NOT NULL,
	"project_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
ALTER TABLE "tbl_message" ADD CONSTRAINT "tbl_message_sender_id_tbl_user_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tbl_message" ADD CONSTRAINT "tbl_message_project_id_tbl_project_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."tbl_project"("id") ON DELETE cascade ON UPDATE no action;