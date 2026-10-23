import { and, asc, desc, eq, max, sql } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import {
  area,
  areaCourse,
  course,
  curriculum,
  curriculumCourse,
  department,
  institution,
  prerequisite,
  program,
  slot,
  track,
  trackCourse,
} from "@/server/db/schema";
import type {
  CatalogInstitution,
  CurriculumData,
  ProgramCurriculum,
} from "@/types/curriculum";
import type { Database } from "@/types/database";

function groupBy<T>(
  rows: T[],
  key: (row: T) => number,
  value: (row: T) => number,
) {
  const groups = new Map<number, number[]>();
  for (const row of rows) {
    groups.set(key(row), [...(groups.get(key(row)) ?? []), value(row)]);
  }
  return (id: number) => groups.get(id) ?? [];
}

function optional<K extends string>(key: K, value: string | null) {
  return value === null ? {} : ({ [key]: value } as Record<K, string>);
}

async function isCurrent(
  db: Database,
  programId: number,
  status: string,
  year: number,
) {
  if (status !== "published") return false;
  const [latest] = await db
    .select({ year: max(curriculum.year) })
    .from(curriculum)
    .where(
      and(
        eq(curriculum.programId, programId),
        eq(curriculum.status, "published"),
      ),
    );
  return latest?.year === year;
}

export async function getCurriculum(
  db: Database,
  curriculumId: number,
): Promise<CurriculumData | null> {
  const [header] = await db
    .select({
      curriculum,
      program,
      department: { name: department.name, acronym: department.acronym },
      institution: { name: institution.name, acronym: institution.acronym },
    })
    .from(curriculum)
    .innerJoin(program, eq(program.id, curriculum.programId))
    .innerJoin(department, eq(department.id, program.departmentId))
    .innerJoin(institution, eq(institution.id, program.institutionId))
    .where(eq(curriculum.id, curriculumId));
  if (!header) return null;

  const inCurriculum = (table: { curriculumId: PgColumn }) =>
    eq(table.curriculumId, curriculumId);

  const [
    courses,
    prerequisites,
    slots,
    areas,
    areaCourses,
    tracks,
    trackCourses,
  ] = await Promise.all([
    db
      .select({
        id: curriculumCourse.id,
        code: course.code,
        name: course.name,
        credits: course.credits,
        description: course.description,
        duration: curriculumCourse.duration,
        prerequisiteCredits: curriculumCourse.prerequisiteCredits,
        isElective: curriculumCourse.isElective,
      })
      .from(curriculumCourse)
      .innerJoin(course, eq(course.id, curriculumCourse.courseId))
      .where(inCurriculum(curriculumCourse))
      .orderBy(asc(curriculumCourse.id)),
    db.select().from(prerequisite).where(inCurriculum(prerequisite)),
    db
      .select()
      .from(slot)
      .where(inCurriculum(slot))
      .orderBy(asc(slot.programYear), asc(slot.term), asc(slot.position)),
    db.select().from(area).where(inCurriculum(area)).orderBy(asc(area.id)),
    db.select().from(areaCourse).where(inCurriculum(areaCourse)),
    db.select().from(track).where(inCurriculum(track)).orderBy(asc(track.id)),
    db.select().from(trackCourse).where(inCurriculum(trackCourse)),
  ]);

  const prerequisitesOf = groupBy(
    prerequisites,
    (row) => row.curriculumCourseId,
    (row) => row.requiredCurriculumCourseId,
  );
  const coursesOfArea = groupBy(
    areaCourses,
    (row) => row.areaId,
    (row) => row.curriculumCourseId,
  );
  const subareasOf = groupBy(
    areas.filter((row) => row.parentAreaId !== null),
    (row) => row.parentAreaId as number,
    (row) => row.id,
  );
  const coursesOfTrack = groupBy(
    trackCourses,
    (row) => row.trackId,
    (row) => row.curriculumCourseId,
  );
  const subtracksOf = groupBy(
    tracks.filter((row) => row.parentTrackId !== null),
    (row) => row.parentTrackId as number,
    (row) => row.id,
  );

  const { curriculum: version, program: programRow } = header;

  return {
    institution: header.institution,
    department: header.department,
    program: {
      name: programRow.name,
      ...optional("siesCode", programRow.siesCode),
      ...(programRow.demreCode === null
        ? {}
        : { demreCode: programRow.demreCode }),
      schedule: programRow.schedule,
    },
    curriculum: {
      id: version.id,
      ...optional("version", version.version),
      year: version.year,
      isCurrent: await isCurrent(
        db,
        version.programId,
        version.status,
        version.year,
      ),
      slots: slots.map((row) => ({
        id: row.id,
        programYear: row.programYear,
        term: row.term,
        position: row.position,
        courseId: row.curriculumCourseId,
      })),
      tracks: tracks.map((row) => ({
        id: row.id,
        name: row.name,
        ...optional("description", row.description),
        courseIds: coursesOfTrack(row.id),
        subplanIds: subtracksOf(row.id),
        requiredCredits: row.requiredCredits ?? -1,
        credential:
          row.credentialType === null || row.credentialName === null
            ? null
            : { type: row.credentialType, name: row.credentialName },
      })),
    },
    areas: areas.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      courseIds: coursesOfArea(row.id),
      subareaIds: subareasOf(row.id),
    })),
    courses: courses.map(({ description, ...row }) => ({
      ...row,
      ...optional("description", description),
      prerequisiteIds: prerequisitesOf(row.id),
    })),
  };
}

export async function getPublishedCurriculum(
  db: Database,
  curriculumId: number,
): Promise<CurriculumData | null> {
  const [published] = await db
    .select({ id: curriculum.id })
    .from(curriculum)
    .where(
      and(eq(curriculum.id, curriculumId), eq(curriculum.status, "published")),
    );
  return published ? getCurriculum(db, published.id) : null;
}

type ProgramParams = { institutionAcronym: string; programSlug: string };

const publishedPrograms = (db: Database) =>
  db
    .selectDistinct({
      institution: { name: institution.name, acronym: institution.acronym },
      department: department.name,
      program: program.name,
      params: {
        institutionAcronym: sql<string>`lower(${institution.acronym})`,
        programSlug: program.slug,
      },
    })
    .from(curriculum)
    .innerJoin(program, eq(program.id, curriculum.programId))
    .innerJoin(department, eq(department.id, program.departmentId))
    .innerJoin(institution, eq(institution.id, program.institutionId))
    .where(eq(curriculum.status, "published"));

export async function getCurriculumParams(
  db: Database,
): Promise<ProgramParams[]> {
  const rows = await publishedPrograms(db);
  return rows.map(({ params }) => params);
}

export async function getCatalog(db: Database): Promise<CatalogInstitution[]> {
  const institutions = new Map<string, CatalogInstitution>();

  for (const row of await publishedPrograms(db)) {
    const catalogInstitution = institutions.get(row.institution.acronym) ?? {
      ...row.institution,
      departments: [],
    };
    institutions.set(row.institution.acronym, catalogInstitution);

    let catalogDepartment = catalogInstitution.departments.find(
      (d) => d.name === row.department,
    );
    if (!catalogDepartment) {
      catalogDepartment = { name: row.department, programs: [] };
      catalogInstitution.departments.push(catalogDepartment);
    }

    catalogDepartment.programs.push({
      name: row.program,
      path: `${row.params.institutionAcronym}/${row.params.programSlug}`,
    });
  }

  const byName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, "es");

  return [...institutions.values()].sort(byName).map((catalogInstitution) => ({
    ...catalogInstitution,
    departments: catalogInstitution.departments
      .sort(byName)
      .map((catalogDepartment) => ({
        ...catalogDepartment,
        programs: catalogDepartment.programs.sort(byName),
      })),
  }));
}

const publishedCurriculumsOf = (
  db: Database,
  { institutionAcronym, programSlug }: ProgramParams,
) =>
  db
    .select({
      id: curriculum.id,
      year: curriculum.year,
      version: curriculum.version,
    })
    .from(curriculum)
    .innerJoin(program, eq(program.id, curriculum.programId))
    .innerJoin(institution, eq(institution.id, program.institutionId))
    .where(
      and(
        eq(curriculum.status, "published"),
        eq(program.slug, programSlug),
        eq(
          sql`lower(${institution.acronym})`,
          institutionAcronym.toLowerCase(),
        ),
      ),
    )
    .orderBy(desc(curriculum.year));

export async function getProgramCurriculums(
  db: Database,
  params: ProgramParams,
): Promise<ProgramCurriculum[]> {
  const rows = await publishedCurriculumsOf(db, params);
  return rows.map(({ version, ...row }) => ({
    ...row,
    ...optional("version", version),
  }));
}

export async function getCurrentCurriculum(
  db: Database,
  params: ProgramParams,
): Promise<CurriculumData | null> {
  const [current] = await publishedCurriculumsOf(db, params).limit(1);
  return current ? getCurriculum(db, current.id) : null;
}
