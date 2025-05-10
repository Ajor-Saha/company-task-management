ALTER TABLE "tbl_task" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tbl_task" ADD COLUMN "end_date" timestamp;