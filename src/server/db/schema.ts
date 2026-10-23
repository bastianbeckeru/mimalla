import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  unique,
} from "drizzle-orm/pg-core";

export const schedule = pgEnum("schedule", ["DAYTIME", "EVENING"]);

export const curriculumStatus = pgEnum("curriculum_status", [
  "draft",
  "published",
]);

export const credentialType = pgEnum("credential_type", [
  "PROFESSIONAL",
  "ACADEMIC",
  "TECHNICAL",
  "CERTIFICATE",
]);

export const institution = pgTable("institution", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  acronym: text().notNull().unique("institution_acronym_unique"),
});

export const department = pgTable(
  "department",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    institutionId: integer()
      .notNull()
      .references(() => institution.id),
    name: text().notNull(),
    acronym: text().notNull(),
  },
  (t) => [
    unique("department_acronym_unique").on(t.institutionId, t.acronym),
    unique("department_id_institution_unique").on(t.id, t.institutionId),
  ],
);

export const program = pgTable(
  "program",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    institutionId: integer()
      .notNull()
      .references(() => institution.id),
    departmentId: integer().notNull(),
    name: text().notNull(),
    slug: text().notNull(),
    siesCode: text(),
    demreCode: integer(),
    schedule: schedule().notNull(),
  },
  (t) => [
    unique("program_slug_unique").on(t.institutionId, t.slug),
    foreignKey({
      name: "program_department_fk",
      columns: [t.departmentId, t.institutionId],
      foreignColumns: [department.id, department.institutionId],
    }),
  ],
);

export const curriculum = pgTable(
  "curriculum",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    programId: integer()
      .notNull()
      .references(() => program.id),
    year: integer().notNull(),
    version: text(),
    status: curriculumStatus().notNull().default("draft"),
  },
  (t) => [unique("curriculum_year_unique").on(t.programId, t.year)],
);

export const course = pgTable(
  "course",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    institutionId: integer()
      .notNull()
      .references(() => institution.id),
    code: text().notNull(),
    name: text().notNull(),
    description: text(),
    credits: integer().notNull(),
  },
  (t) => [
    unique("course_code_unique").on(t.institutionId, t.code),
    check("course_code_not_empty", sql`btrim(${t.code}) <> ''`),
  ],
);

export const curriculumCourse = pgTable(
  "curriculum_course",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    curriculumId: integer()
      .notNull()
      .references(() => curriculum.id, { onDelete: "cascade" }),
    courseId: integer()
      .notNull()
      .references(() => course.id),
    duration: integer().notNull(),
    prerequisiteCredits: integer().notNull(),
    isElective: boolean().notNull(),
  },
  (t) => [
    unique("curriculum_course_unique").on(t.curriculumId, t.courseId),
    unique("curriculum_course_id_curriculum_unique").on(t.id, t.curriculumId),
  ],
);

export const prerequisite = pgTable(
  "prerequisite",
  {
    curriculumId: integer().notNull(),
    curriculumCourseId: integer().notNull(),
    requiredCurriculumCourseId: integer().notNull(),
  },
  (t) => [
    primaryKey({
      name: "prerequisite_pk",
      columns: [t.curriculumCourseId, t.requiredCurriculumCourseId],
    }),
    foreignKey({
      name: "prerequisite_course_fk",
      columns: [t.curriculumCourseId, t.curriculumId],
      foreignColumns: [curriculumCourse.id, curriculumCourse.curriculumId],
    }).onDelete("cascade"),
    foreignKey({
      name: "prerequisite_required_course_fk",
      columns: [t.requiredCurriculumCourseId, t.curriculumId],
      foreignColumns: [curriculumCourse.id, curriculumCourse.curriculumId],
    }).onDelete("cascade"),
    check(
      "prerequisite_not_self",
      sql`${t.curriculumCourseId} <> ${t.requiredCurriculumCourseId}`,
    ),
  ],
);

export const slot = pgTable(
  "slot",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    curriculumId: integer().notNull(),
    curriculumCourseId: integer().notNull(),
    programYear: integer().notNull(),
    term: integer().notNull(),
    position: integer().notNull(),
  },
  (t) => [
    unique("slot_place_unique").on(
      t.curriculumId,
      t.programYear,
      t.term,
      t.position,
    ),
    foreignKey({
      name: "slot_course_fk",
      columns: [t.curriculumCourseId, t.curriculumId],
      foreignColumns: [curriculumCourse.id, curriculumCourse.curriculumId],
    }).onDelete("cascade"),
    check("slot_term_range", sql`${t.term} between 1 and 4`),
  ],
);

export const area = pgTable(
  "area",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    curriculumId: integer()
      .notNull()
      .references(() => curriculum.id, { onDelete: "cascade" }),
    parentAreaId: integer(),
    name: text().notNull(),
    color: text().notNull(),
  },
  (t) => [
    unique("area_id_curriculum_unique").on(t.id, t.curriculumId),
    foreignKey({
      name: "area_parent_fk",
      columns: [t.parentAreaId, t.curriculumId],
      foreignColumns: [t.id, t.curriculumId],
    }).onDelete("cascade"),
  ],
);

export const areaCourse = pgTable(
  "area_course",
  {
    curriculumId: integer().notNull(),
    areaId: integer().notNull(),
    curriculumCourseId: integer().notNull(),
  },
  (t) => [
    primaryKey({
      name: "area_course_pk",
      columns: [t.areaId, t.curriculumCourseId],
    }),
    foreignKey({
      name: "area_course_area_fk",
      columns: [t.areaId, t.curriculumId],
      foreignColumns: [area.id, area.curriculumId],
    }).onDelete("cascade"),
    foreignKey({
      name: "area_course_course_fk",
      columns: [t.curriculumCourseId, t.curriculumId],
      foreignColumns: [curriculumCourse.id, curriculumCourse.curriculumId],
    }).onDelete("cascade"),
  ],
);

export const track = pgTable(
  "track",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    curriculumId: integer()
      .notNull()
      .references(() => curriculum.id, { onDelete: "cascade" }),
    parentTrackId: integer(),
    name: text().notNull(),
    description: text(),
    requiredCredits: integer(),
    credentialType: credentialType(),
    credentialName: text(),
  },
  (t) => [
    unique("track_id_curriculum_unique").on(t.id, t.curriculumId),
    foreignKey({
      name: "track_parent_fk",
      columns: [t.parentTrackId, t.curriculumId],
      foreignColumns: [t.id, t.curriculumId],
    }).onDelete("cascade"),
    check(
      "track_credential_both_or_none",
      sql`(${t.credentialType} is null) = (${t.credentialName} is null)`,
    ),
  ],
);

export const trackCourse = pgTable(
  "track_course",
  {
    curriculumId: integer().notNull(),
    trackId: integer().notNull(),
    curriculumCourseId: integer().notNull(),
  },
  (t) => [
    primaryKey({
      name: "track_course_pk",
      columns: [t.trackId, t.curriculumCourseId],
    }),
    foreignKey({
      name: "track_course_track_fk",
      columns: [t.trackId, t.curriculumId],
      foreignColumns: [track.id, track.curriculumId],
    }).onDelete("cascade"),
    foreignKey({
      name: "track_course_course_fk",
      columns: [t.curriculumCourseId, t.curriculumId],
      foreignColumns: [curriculumCourse.id, curriculumCourse.curriculumId],
    }).onDelete("cascade"),
  ],
);
