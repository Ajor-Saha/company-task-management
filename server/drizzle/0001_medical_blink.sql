CREATE TABLE "tbl_bot_message" (
	"id" text PRIMARY KEY NOT NULL,
	"user_message" varchar(1000) NOT NULL,
	"bot_message" varchar(1000) NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT current_timestamp
);
--> statement-breakpoint
ALTER TABLE "tbl_bot_message" ADD CONSTRAINT "tbl_bot_message_user_id_tbl_user_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tbl_user"("user_id") ON DELETE cascade ON UPDATE no action;