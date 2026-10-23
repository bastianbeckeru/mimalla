CREATE TYPE "public"."credential_type" AS ENUM('PROFESSIONAL', 'ACADEMIC', 'TECHNICAL', 'CERTIFICATE');--> statement-breakpoint
CREATE TYPE "public"."curriculum_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."schedule" AS ENUM('DAYTIME', 'EVENING');--> statement-breakpoint
CREATE TABLE "area" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "area_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"curriculum_id" integer NOT NULL,
	"parent_area_id" integer,
	"name" text NOT NULL,
	"color" text NOT NULL,
	CONSTRAINT "area_id_curriculum_unique" UNIQUE("id","curriculum_id")
);
--> statement-breakpoint
CREATE TABLE "area_course" (
	"curriculum_id" integer NOT NULL,
	"area_id" integer NOT NULL,
	"curriculum_course_id" integer NOT NULL,
	CONSTRAINT "area_course_pk" PRIMARY KEY("area_id","curriculum_course_id")
);
--> statement-breakpoint
CREATE TABLE "course" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "course_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"institution_id" integer NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"credits" integer NOT NULL,
	CONSTRAINT "course_code_unique" UNIQUE("institution_id","code"),
	CONSTRAINT "course_code_not_empty" CHECK (btrim("course"."code") <> '')
);
--> statement-breakpoint
CREATE TABLE "curriculum" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curriculum_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"program_id" integer NOT NULL,
	"year" integer NOT NULL,
	"version" text,
	"status" "curriculum_status" DEFAULT 'draft' NOT NULL,
	CONSTRAINT "curriculum_year_unique" UNIQUE("program_id","year")
);
--> statement-breakpoint
CREATE TABLE "curriculum_course" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "curriculum_course_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"curriculum_id" integer NOT NULL,
	"course_id" integer NOT NULL,
	"duration" integer NOT NULL,
	"prerequisite_credits" integer NOT NULL,
	"is_elective" boolean NOT NULL,
	CONSTRAINT "curriculum_course_unique" UNIQUE("curriculum_id","course_id"),
	CONSTRAINT "curriculum_course_id_curriculum_unique" UNIQUE("id","curriculum_id")
);
--> statement-breakpoint
CREATE TABLE "department" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "department_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"institution_id" integer NOT NULL,
	"name" text NOT NULL,
	"acronym" text NOT NULL,
	CONSTRAINT "department_acronym_unique" UNIQUE("institution_id","acronym"),
	CONSTRAINT "department_id_institution_unique" UNIQUE("id","institution_id")
);
--> statement-breakpoint
CREATE TABLE "institution" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "institution_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"acronym" text NOT NULL,
	CONSTRAINT "institution_acronym_unique" UNIQUE("acronym")
);
--> statement-breakpoint
CREATE TABLE "prerequisite" (
	"curriculum_id" integer NOT NULL,
	"curriculum_course_id" integer NOT NULL,
	"required_curriculum_course_id" integer NOT NULL,
	CONSTRAINT "prerequisite_pk" PRIMARY KEY("curriculum_course_id","required_curriculum_course_id"),
	CONSTRAINT "prerequisite_not_self" CHECK ("prerequisite"."curriculum_course_id" <> "prerequisite"."required_curriculum_course_id")
);
--> statement-breakpoint
CREATE TABLE "program" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "program_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"institution_id" integer NOT NULL,
	"department_id" integer NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"sies_code" text,
	"demre_code" integer,
	"schedule" "schedule" NOT NULL,
	CONSTRAINT "program_slug_unique" UNIQUE("institution_id","slug")
);
--> statement-breakpoint
CREATE TABLE "slot" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "slot_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"curriculum_id" integer NOT NULL,
	"curriculum_course_id" integer NOT NULL,
	"program_year" integer NOT NULL,
	"term" integer NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "slot_place_unique" UNIQUE("curriculum_id","program_year","term","position"),
	CONSTRAINT "slot_term_range" CHECK ("slot"."term" between 1 and 4)
);
--> statement-breakpoint
CREATE TABLE "track" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "track_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"curriculum_id" integer NOT NULL,
	"parent_track_id" integer,
	"name" text NOT NULL,
	"description" text,
	"required_credits" integer,
	"credential_type" "credential_type",
	"credential_name" text,
	CONSTRAINT "track_id_curriculum_unique" UNIQUE("id","curriculum_id"),
	CONSTRAINT "track_credential_both_or_none" CHECK (("track"."credential_type" is null) = ("track"."credential_name" is null))
);
--> statement-breakpoint
CREATE TABLE "track_course" (
	"curriculum_id" integer NOT NULL,
	"track_id" integer NOT NULL,
	"curriculum_course_id" integer NOT NULL,
	CONSTRAINT "track_course_pk" PRIMARY KEY("track_id","curriculum_course_id")
);
--> statement-breakpoint
ALTER TABLE "area" ADD CONSTRAINT "area_curriculum_id_curriculum_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curriculum"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area" ADD CONSTRAINT "area_parent_fk" FOREIGN KEY ("parent_area_id","curriculum_id") REFERENCES "public"."area"("id","curriculum_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area_course" ADD CONSTRAINT "area_course_area_fk" FOREIGN KEY ("area_id","curriculum_id") REFERENCES "public"."area"("id","curriculum_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "area_course" ADD CONSTRAINT "area_course_course_fk" FOREIGN KEY ("curriculum_course_id","curriculum_id") REFERENCES "public"."curriculum_course"("id","curriculum_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum" ADD CONSTRAINT "curriculum_program_id_program_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."program"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_course" ADD CONSTRAINT "curriculum_course_curriculum_id_curriculum_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curriculum"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curriculum_course" ADD CONSTRAINT "curriculum_course_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department" ADD CONSTRAINT "department_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prerequisite" ADD CONSTRAINT "prerequisite_course_fk" FOREIGN KEY ("curriculum_course_id","curriculum_id") REFERENCES "public"."curriculum_course"("id","curriculum_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prerequisite" ADD CONSTRAINT "prerequisite_required_course_fk" FOREIGN KEY ("required_curriculum_course_id","curriculum_id") REFERENCES "public"."curriculum_course"("id","curriculum_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program" ADD CONSTRAINT "program_institution_id_institution_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institution"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program" ADD CONSTRAINT "program_department_fk" FOREIGN KEY ("department_id","institution_id") REFERENCES "public"."department"("id","institution_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot" ADD CONSTRAINT "slot_course_fk" FOREIGN KEY ("curriculum_course_id","curriculum_id") REFERENCES "public"."curriculum_course"("id","curriculum_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track" ADD CONSTRAINT "track_curriculum_id_curriculum_id_fk" FOREIGN KEY ("curriculum_id") REFERENCES "public"."curriculum"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track" ADD CONSTRAINT "track_parent_fk" FOREIGN KEY ("parent_track_id","curriculum_id") REFERENCES "public"."track"("id","curriculum_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_course" ADD CONSTRAINT "track_course_track_fk" FOREIGN KEY ("track_id","curriculum_id") REFERENCES "public"."track"("id","curriculum_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_course" ADD CONSTRAINT "track_course_course_fk" FOREIGN KEY ("curriculum_course_id","curriculum_id") REFERENCES "public"."curriculum_course"("id","curriculum_id") ON DELETE cascade ON UPDATE no action;