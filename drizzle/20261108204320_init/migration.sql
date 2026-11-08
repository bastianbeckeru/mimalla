CREATE TABLE "institution" (
	"id" text PRIMARY KEY,
	"slug" text NOT NULL CONSTRAINT "institution_slug_key" UNIQUE,
	"acronym" text NOT NULL,
	"name" text NOT NULL,
	"country" text NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "program" (
	"id" text PRIMARY KEY,
	"institution_id" text NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	CONSTRAINT "program_institution_id_slug_key" UNIQUE("institution_id","slug")
);
--> statement-breakpoint
ALTER TABLE "program" ADD CONSTRAINT "program_institution_id_institution_id_fkey" FOREIGN KEY ("institution_id") REFERENCES "institution"("id");