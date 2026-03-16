CREATE TYPE "public"."issue_severity" AS ENUM('critical', 'warning', 'good');--> statement-breakpoint
CREATE TYPE "public"."language" AS ENUM('javascript', 'typescript', 'python', 'rust', 'go', 'java', 'c', 'cpp', 'csharp', 'php', 'ruby', 'swift', 'kotlin', 'sql', 'shell', 'other');--> statement-breakpoint
CREATE TYPE "public"."verdict" AS ENUM('needs_serious_help', 'pretty_bad', 'could_be_worse', 'not_terrible', 'surprisingly_good');--> statement-breakpoint
CREATE TABLE "roasts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"language" "language" DEFAULT 'other' NOT NULL,
	"line_count" integer DEFAULT 0 NOT NULL,
	"roast_mode" boolean DEFAULT false NOT NULL,
	"score" numeric(4, 2) NOT NULL,
	"roast_quote" text NOT NULL,
	"verdict" "verdict" NOT NULL,
	"issues" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"suggested_fix" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "roasts_score_idx" ON "roasts" USING btree ("score");--> statement-breakpoint
CREATE INDEX "roasts_created_at_idx" ON "roasts" USING btree ("created_at");