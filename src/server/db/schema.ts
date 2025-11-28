import { relations, sql } from 'drizzle-orm';
import {
  boolean,
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
} from 'drizzle-orm/pg-core';

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */

//export const createTable = pgTableCreator((name) => `mimalla_${name}`);
export const createTable = pgTable;

export const posts = createTable(
  'post',
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => user.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index('created_by_idx').on(t.createdById),
    index('name_idx').on(t.name),
  ]
);

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified')
    .$defaultFn(() => false)
    .notNull(),
  image: text('image'),
  createdAt: timestamp('created_at')
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp('updated_at')
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
  updatedAt: timestamp('updated_at').$defaultFn(
    () => /* @__PURE__ */ new Date()
  ),
});

export const userRelations = relations(user, ({ many }) => ({
  account: many(account),
  session: many(session),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

// MiMalla Schema for Curriculums

export const institutions = createTable(
  'institution',
  {
    id: serial('id').primaryKey(),
    //rut: varchar("rut", { length: 15 }).unique().notNull(), // Move it to metadata: jsonb("metadata")
    name: varchar('name', { length: 255 }).notNull(),
    acronym: varchar('acronym', { length: 10 }).notNull(),
  },
  (institution) => ({
    acronymIndex: index('institution_acronym_idx').on(institution.acronym),
  })
);
export const institutionsRelations = relations(institutions, ({ many }) => ({
  departments: many(departments),
}));

export const departments = createTable('department', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  institutionId: integer('institution_id')
    .references(() => institutions.id, { onDelete: 'cascade' })
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
  'program',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    siesCode: varchar('sies_code', { length: 255 }).unique(),
    demreCode: integer('demre_code'),
    departmentId: integer('department_id')
      .references(() => departments.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (program) => ({
    departmentIdIdx: index('program_department_id_idx').on(
      program.departmentId
    ),
  })
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
  'area',
  {
    id: serial('id').primaryKey(),
    name: varchar('name', { length: 255 }).notNull(),
    color: varchar('color', { length: 7 }), // #RRGGBB
    /*     departmentId: integer("department_id")
      .references(() => departments.id, { onDelete: "cascade" })
      .notNull(), */
  }
  /*   (area) => ({
    departmentIdIdx: index("area_department_id_idx").on(area.departmentId),
  }), */
);
export const areasRelations = relations(areas, ({ many }) => ({
  courseAreas: many(courseAreas),
}));

export const curriculums = createTable(
  'curriculum',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    //year: integer("year").notNull(), // Should we use year or version? or both?
    programId: integer('program_id')
      .references(() => programs.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (curriculum) => ({
    programIdIdx: index('curriculum_program_id_idx').on(curriculum.programId),
  })
);
export const curriculumsRelations = relations(curriculums, ({ one, many }) => ({
  program: one(programs, {
    fields: [curriculums.programId],
    references: [programs.id],
  }),
  cycles: many(cycles),
}));

export const degreeTypeEnum = pgEnum('degree_type', [
  'CERTIFICATE', // Certificado
  'INTERMEDIATE', // Salida Intermedia: Técnico de Nivel Superior
  'ACADEMIC', // Grado Académico: Licenciatura
  'MENTION', // Mención
  'PROFESSIONAL', // Título Profesional
]);
export const degrees = createTable('degree', {
  id: serial('id').primaryKey(),
  name: varchar('name').notNull(),
  type: degreeTypeEnum('type').notNull(),
});
export const degreesRelations = relations(degrees, ({ many }) => ({
  cycles: many(cycleDegrees),
}));

export const cycles = createTable(
  'cycle',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    //name: varchar("name").notNull(),
    curriculumId: uuid('curriculum_id')
      .references(() => curriculums.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (cycle) => ({
    curriculumIdIdx: index('cycle_curriculum_id_idx').on(cycle.curriculumId),
  })
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
  'cycle_degrees',
  {
    degreeId: integer('degree_id')
      .references(() => degrees.id, { onDelete: 'cascade' })
      .notNull(),
    cycleId: uuid('cycle_id')
      .references(() => cycles.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({ columns: [table.cycleId, table.degreeId] }),
  })
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
  'enrollment',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    year: integer('year').notNull(),
    term: smallint('term').notNull(),
    position: integer('position').notNull(),
    //mandatory: boolean("mandatory").default(true),
    //status: enrollmentStatusEnum("status").default("PENDING"),
    courseId: integer('course_id').references(() => courses.id, {
      onDelete: 'set null',
    }),
    cycleId: uuid('cycle_id')
      .references(() => cycles.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (enrollment) => ({
    courseIdIdx: index('enrollment_course_id_idx').on(enrollment.courseId),
    cycleIdIdx: index('course_enrollment_cycle_id_idx').on(enrollment.cycleId),
    uniqueEnrollment: uniqueIndex('unique_course_enrollment').on(
      enrollment.year,
      enrollment.term,
      enrollment.position,
      enrollment.courseId,
      enrollment.cycleId
    ),
  })
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
  'course',
  {
    id: serial('id').primaryKey(),
    code: varchar('code'),
    name: varchar('name').notNull(),
    credits: integer('credits').notNull().default(0),
    duration: integer('duration').notNull().default(1),
    prerequisiteCredits: integer('prerequisite_credits').notNull().default(0),
  },
  (course) => ({
    codeIdx: index('course_code_idx').on(course.code),
  })
);
export const coursesRelations = relations(courses, ({ many }) => ({
  subsequents: many(coursePrerequisites, {
    relationName: 'subsequents',
  }),
  prerequisites: many(coursePrerequisites, {
    relationName: 'prerequisites',
  }),
  enrollments: many(enrollments),
  courseAreas: many(courseAreas),
}));

export const coursePrerequisites = createTable(
  'course_prerequisites',
  {
    courseId: integer('course_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),
    prerequisiteId: integer('prerequisite_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.courseId, table.prerequisiteId],
    }),
  })
);
export const coursePrerequisitesRelations = relations(
  coursePrerequisites,
  ({ one }) => ({
    course: one(courses, {
      fields: [coursePrerequisites.courseId],
      references: [courses.id],
      relationName: 'prerequisites',
    }),
    prerequisite: one(courses, {
      fields: [coursePrerequisites.prerequisiteId],
      references: [courses.id],
      relationName: 'subsequents',
    }),
  })
);
export const courseAreas = createTable(
  'course_areas',
  {
    courseId: integer('course_id')
      .references(() => courses.id, { onDelete: 'cascade' })
      .notNull(),
    areaId: integer('area_id')
      .references(() => areas.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => ({
    compoundKey: primaryKey({
      columns: [table.courseId, table.areaId],
    }),
  })
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
