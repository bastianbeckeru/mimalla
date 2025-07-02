import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

//export const createTable = pgTableCreator((name) => `mimalla_${name}`);
export const createTable = pgTable;

export const users = createTable("user", (d) => ({
  id: d
    .uuid()
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: d.varchar({ length: 255 }),
  image: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  joinedAt: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// MiMalla Schema for Curriculums

export const institutions = createTable(
  "institution",
  {
    id: serial("id").primaryKey(),
    //rut: varchar("rut", { length: 15 }).unique().notNull(), // Move it to metadata: jsonb("metadata")
    name: varchar("name", { length: 255 }).notNull(),
    acronym: varchar("acronym", { length: 10 }).notNull(),
  },
  (institution) => ({
    acronymIndex: index("institution_acronym_idx").on(institution.acronym),
  }),
);
export const institutionsRelations = relations(institutions, ({ many }) => ({
  departments: many(departments),
}));

export const departments = createTable("department", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  institutionId: integer("institution_id")
    .references(() => institutions.id, { onDelete: "cascade" })
    .notNull(),
});
export const departmentsRelations = relations(departments, ({ one, many }) => ({
  institution: one(institutions, {
    fields: [departments.institutionId],
    references: [institutions.id],
  }),
  programs: many(programs),
}));

export const programs = createTable(
  "program",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    siesCode: varchar("sies_code", { length: 255 }).unique(),
    demreCode: integer("demre_code"),
    departmentId: integer("department_id")
      .references(() => departments.id, { onDelete: "cascade" })
      .notNull(),
  },
  (program) => ({
    departmentIdIdx: index("program_department_id_idx").on(
      program.departmentId,
    ),
  }),
);
export const programsRelations = relations(programs, ({ one, many }) => ({
  department: one(departments, {
    fields: [programs.departmentId],
    references: [departments.id],
  }),
  curriculums: many(curriculums),
}));

// ❗Es necesario que area pertenezca a un departamento?
export const areas = createTable(
  "area",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    color: varchar("color", { length: 7 }), // #RRGGBB
    /*     departmentId: integer("department_id")
      .references(() => departments.id, { onDelete: "cascade" })
      .notNull(), */
  },
  /*   (area) => ({
    departmentIdIdx: index("area_department_id_idx").on(area.departmentId),
  }), */
);
export const areasRelations = relations(areas, ({ many }) => ({
  courseAreas: many(courseAreas),
}));

export const curriculums = createTable(
  "curriculum",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    //year: integer("year").notNull(), // Should we use year or version? or both?
    programId: integer("program_id")
      .references(() => programs.id, { onDelete: "cascade" })
      .notNull(),
  },
  (curriculum) => ({
    programIdIdx: index("curriculum_program_id_idx").on(curriculum.programId),
  }),
);
export const curriculumsRelations = relations(curriculums, ({ one, many }) => ({
  program: one(programs, {
    fields: [curriculums.programId],
    references: [programs.id],
  }),
  cycles: many(cycles),
}));

export const degreeTypeEnum = pgEnum("degree_type", [
  "CERTIFICATE", // Certificado
  "INTERMEDIATE", // Salida Intermedia: Técnico de Nivel Superior
  "ACADEMIC", // Grado Académico: Licenciatura
  "MENTION", // Mención
  "PROFESSIONAL", // Título Profesional
]);
export const degrees = createTable("degree", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: degreeTypeEnum("type").notNull(),
});
export const degreesRelations = relations(degrees, ({ many }) => ({
  cycles: many(cycleDegrees),
}));

export const cycles = createTable(
  "cycle",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    //name: varchar("name").notNull(),
    curriculumId: uuid("curriculum_id")
      .references(() => curriculums.id, { onDelete: "cascade" })
      .notNull(),
  },
  (cycle) => ({
    curriculumIdIdx: index("cycle_curriculum_id_idx").on(cycle.curriculumId),
  }),
);
export const cyclesRelations = relations(cycles, ({ one, many }) => ({
  curriculum: one(curriculums, {
    fields: [cycles.curriculumId],
    references: [curriculums.id],
  }),
  degrees: many(cycleDegrees),
  enrollments: many(enrollments),
}));

export const cycleDegrees = createTable(
  "cycle_degrees",
  {
    degreeId: integer("degree_id")
      .references(() => degrees.id, { onDelete: "cascade" })
      .notNull(),
    cycleId: uuid("cycle_id")
      .references(() => cycles.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.cycleId, table.degreeId] }),
  }),
);
export const cycleDegreesRelations = relations(cycleDegrees, ({ one }) => ({
  cycle: one(cycles, {
    fields: [cycleDegrees.cycleId],
    references: [cycles.id],
  }),
  degree: one(degrees, {
    fields: [cycleDegrees.degreeId],
    references: [degrees.id],
  }),
}));

export const enrollments = createTable(
  "enrollment",
  {
    id: uuid("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    year: integer("year").notNull(),
    term: smallint("term").notNull(),
    position: integer("position").notNull(),
    //mandatory: boolean("mandatory").default(true),
    //status: enrollmentStatusEnum("status").default("PENDING"),
    courseId: integer("course_id").references(() => courses.id, {
      onDelete: "set null",
    }),
    cycleId: uuid("cycle_id")
      .references(() => cycles.id, { onDelete: "cascade" })
      .notNull(),
  },
  (enrollment) => ({
    courseIdIdx: index("enrollment_course_id_idx").on(enrollment.courseId),
    cycleIdIdx: index("course_enrollment_cycle_id_idx").on(enrollment.cycleId),
    uniqueEnrollment: uniqueIndex("unique_course_enrollment").on(
      enrollment.year,
      enrollment.term,
      enrollment.position,
      enrollment.courseId,
      enrollment.cycleId,
    ),
  }),
);
export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  cycles: one(cycles, {
    fields: [enrollments.cycleId],
    references: [cycles.id],
  }),
  course: one(courses, {
    fields: [enrollments.courseId],
    references: [courses.id],
  }),
}));

export const courses = createTable(
  "course",
  {
    id: serial("id").primaryKey(),
    code: varchar("code"),
    name: varchar("name").notNull(),
    credits: integer("credits").notNull().default(0),
    duration: integer("duration").notNull().default(1),
    prerequisiteCredits: integer("prerequisite_credits").notNull().default(0),
  },
  (course) => ({
    codeIdx: index("course_code_idx").on(course.code),
  }),
);
export const coursesRelations = relations(courses, ({ many }) => ({
  subsequents: many(coursePrerequisites, {
    relationName: "subsequents",
  }),
  prerequisites: many(coursePrerequisites, {
    relationName: "prerequisites",
  }),
  enrollments: many(enrollments),
  courseAreas: many(courseAreas),
}));

export const coursePrerequisites = createTable(
  "course_prerequisites",
  {
    courseId: integer("course_id")
      .references(() => courses.id, { onDelete: "cascade" })
      .notNull(),
    prerequisiteId: integer("prerequisite_id")
      .references(() => courses.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.courseId, table.prerequisiteId],
    }),
  }),
);
export const coursePrerequisitesRelations = relations(
  coursePrerequisites,
  ({ one }) => ({
    course: one(courses, {
      fields: [coursePrerequisites.courseId],
      references: [courses.id],
      relationName: "prerequisites",
    }),
    prerequisite: one(courses, {
      fields: [coursePrerequisites.prerequisiteId],
      references: [courses.id],
      relationName: "subsequents",
    }),
  }),
);
export const courseAreas = createTable(
  "course_areas",
  {
    courseId: integer("course_id")
      .references(() => courses.id, { onDelete: "cascade" })
      .notNull(),
    areaId: integer("area_id")
      .references(() => areas.id, { onDelete: "cascade" })
      .notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.courseId, table.areaId],
    }),
  }),
);
export const courseAreasRelations = relations(courseAreas, ({ one }) => ({
  course: one(courses, {
    fields: [courseAreas.courseId],
    references: [courses.id],
  }),
  area: one(areas, {
    fields: [courseAreas.areaId],
    references: [areas.id],
  }),
}));

/*
export const posts = createTable(
  "post",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 256 }),
    createdById: varchar("created_by", { length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
  },
  (example) => ({
    createdByIdIdx: index("created_by_idx").on(example.createdById),
    nameIndex: index("name_idx").on(example.name),
  }),
);
*/
