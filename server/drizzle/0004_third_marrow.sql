ALTER TABLE "tbl_project" ADD COLUMN "start_date" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "tbl_project" ADD COLUMN "end_date" timestamp;