/* import { z } from "zod";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import {
  areas,
  courseAreas,
  departments,
  institutions,
  programs,
} from "@/server/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";
import type { CurriculumProps, ProgramProps } from "@/types/curriculum";
//import { institutions } from "@/server/db/schema";

export const institutionRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const institutions = await ctx.db.query.institutions.findMany({
      orderBy: (institution, { desc }) => [desc(institution.acronym)],
    });

    return institutions ?? null;
  }),
  get: publicProcedure
    .input(z.object({ acronym: z.string() }))
    .query(async ({ ctx, input }) => {
      const institution = await ctx.db.query.institutions.findFirst({
        where: (institution, { eq }) => eq(institution.acronym, input.acronym),
      });

      return institution ?? null;
    }),

  getWithPrograms: publicProcedure
    .input(z.object({ acronym: z.string() }))
    .query(async ({ ctx, input }) => {
      const institution = await ctx.db.query.institutions.findFirst({
        where: (institution, { eq }) => eq(institution.acronym, input.acronym),
        with: {
          departments: {
            with: {
              programs: true,
            },
          },
        },
      });

      return institution ?? null;
    }),

  getProgram: publicProcedure
    .input(z.object({ acronym: z.string(), programName: z.string() }))
    .query(async ({ ctx, input }) => {
      const matchedProgram = await ctx.db
        .select({
          id: programs.id,
        })
        .from(programs)
        .innerJoin(departments, eq(departments.id, programs.departmentId))
        .innerJoin(institutions, eq(institutions.id, departments.institutionId))
        .where(
          and(
            eq(institutions.acronym, input.acronym),
            sql`lower(replace(translate(${programs.name}, 'áéíóúüñ', 'aeiouun'), ' ', '-')) = ${input.programName}`,
          ),
        )
        .limit(1);

      const firstProgram = matchedProgram[0];
      if (!matchedProgram || !firstProgram) return null;

      const programWithCurriculum = await ctx.db.query.programs.findFirst({
        where: (programs, { eq }) => eq(programs.id, firstProgram.id),
        with: {
          curriculums: {
            //orderBy: (curriculum, { desc }) => [desc(curriculum.year)],
            limit: 1,
            with: {
              cycles: {
                //orderBy: (cycle, { asc }) => [asc(cycle.order)],
                with: {
                  enrollments: {
                    orderBy: (enrollment, { asc }) => [
                      asc(enrollment.year),
                      asc(enrollment.term),
                      asc(enrollment.position),
                    ],
                  },
                },
              },
            },
          },
        },
      });

      const firstCurriculum = programWithCurriculum?.curriculums.at(0);
      if (!programWithCurriculum || !firstCurriculum) return null;

      const courseIds = extractCourseIds(firstCurriculum);

      const matchedAreas = await ctx.db
        .select({
          id: areas.id,
        })
        .from(areas)
        .innerJoin(courseAreas, eq(courseAreas.areaId, areas.id))
        .where(inArray(courseAreas.courseId, courseIds))
        .groupBy(areas.id);

      const programAreas = await ctx.db.query.areas.findMany({
        where: (area, { inArray }) =>
          inArray(
            area.id,
            matchedAreas.map((area) => area.id),
          ),
        with: {
          courseAreas: {
            where: (courseAreas, { inArray }) =>
              inArray(courseAreas.courseId, courseIds),
          },
        },
      });

      const programCourses = await ctx.db.query.courses.findMany({
        where: (course, { inArray }) => inArray(course.id, courseIds),
        orderBy: (course, { asc }) => [asc(course.id)],
        with: {
          prerequisites: true,
          subsequents: true,
        },
      });

      const fixedAreas = programAreas.map((area) => {
        return {
          ...area,
          courses: area.courseAreas.flatMap((c) => c.courseId),
        };
      });
      const fixedCourses = programCourses.map((course) => {
        return {
          ...course,
          prerequisites: course.prerequisites.map((p) => p.prerequisiteId),
          subsequents: course.subsequents.map((s) => s.courseId),
        };
      });

      return {
        program: programWithCurriculum,
        areas: fixedAreas,
        courses: fixedCourses,
      };
    }),

  getCourses: publicProcedure.query(async ({ ctx }) => {
    const courses = await ctx.db.query.courses.findMany({
      orderBy: (course, { asc }) => [asc(course.id)],
      with: {
        prerequisites: true,
        subsequents: true,
      },
    });

    const test2 = courses.map((course) => {
      return {
        ...course,
        prerequisites: course.prerequisites.map((p) => p.prerequisiteId),
        subsequents: course.subsequents.map((s) => s.courseId),
      };
    });

    return test2;
  }),
});

function extractCourseIds(curriculum: CurriculumProps) {
  const uniqueCourseIds = new Set(
    curriculum.cycles
      .flatMap((cycle) =>
        cycle.enrollments.map((enrollment) => enrollment.courseId),
      )
      .filter((courseId) => courseId !== null),
  );
  return Array.from(uniqueCourseIds);
}
 */
