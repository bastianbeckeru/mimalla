import { and, eq, sql } from "drizzle-orm";
import { validateCurriculum } from "@/server/catalog/validate-curriculum";
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
import type { CredentialType, Program } from "@/types/curriculum";
import type { Database } from "@/types/database";
import type { Problem } from "@/types/validation";

type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];

type NameAndAcronym = { name: string; acronym: string };

type CurriculumFile = {
  institution: NameAndAcronym;
  department: NameAndAcronym;
  program: Program;
  curriculum: {
    version?: string | null;
    year: number;
    structure: {
      year: number;
      term: number;
      position: number;
      courseId: number;
    }[];
    plans: {
      id: number;
      name: string;
      description?: string | null;
      requiredCredits: number;
      courseIds: number[];
      subplanIds: number[];
      credential: { type: CredentialType; name: string } | null;
    }[];
  };
  areas: {
    id: number;
    name: string;
    color: string;
    courseIds: number[];
    subareaIds: number[];
  }[];
  courses: {
    id: number;
    code: string;
    name: string;
    description?: string | null;
    credits: number;
    duration: number;
    prerequisiteCredits: number;
    prerequisiteIds: number[];
    isElective: boolean;
  }[];
};

type ImportOptions = {
  programSlug: string;
  publish?: boolean;
  replace?: boolean;
};

type ImportResult =
  | { ok: true; curriculumId: number }
  | { ok: false; problems: Problem[] }
  | { ok: false; existingCurriculumId: number };

class RejectedFile extends Error {
  constructor(readonly problems: Problem[]) {
    super("curriculum file rejected");
  }
}

class ExistingCurriculum extends Error {
  constructor(readonly curriculumId: number) {
    super("curriculum already exists");
  }
}

type FileHeader = {
  institution?: { acronym?: unknown };
  curriculum?: { year?: unknown };
};

function headerOf(file: unknown) {
  if (typeof file !== "object" || file === null) return {};
  const { institution, curriculum } = file as FileHeader;
  return {
    acronym:
      typeof institution?.acronym === "string"
        ? institution.acronym
        : undefined,
    year: Number.isInteger(curriculum?.year)
      ? (curriculum?.year as number)
      : undefined,
  };
}

async function findInstitution(tx: Transaction, acronym: string) {
  const [found] = await tx
    .select({ id: institution.id })
    .from(institution)
    .where(eq(institution.acronym, acronym));
  return found?.id;
}

async function coursesOfReplacedCurriculum(
  tx: Transaction,
  institutionId: number,
  programSlug: string,
  year: number | undefined,
) {
  if (year === undefined) return new Set<number>();
  const rows = await tx
    .select({ courseId: curriculumCourse.courseId })
    .from(curriculumCourse)
    .innerJoin(curriculum, eq(curriculum.id, curriculumCourse.curriculumId))
    .innerJoin(program, eq(program.id, curriculum.programId))
    .where(
      and(
        eq(program.institutionId, institutionId),
        eq(program.slug, programSlug),
        eq(curriculum.year, year),
      ),
    );
  return new Set(rows.map(({ courseId }) => courseId));
}

async function knownCoursesOf(
  tx: Transaction,
  file: unknown,
  { programSlug, replace = false }: ImportOptions,
) {
  const { acronym, year } = headerOf(file);
  const institutionId = acronym && (await findInstitution(tx, acronym));
  if (!institutionId) return [];
  const courses = await tx
    .select({
      id: course.id,
      code: course.code,
      name: course.name,
      credits: course.credits,
    })
    .from(course)
    .where(eq(course.institutionId, institutionId));
  const replaced = replace
    ? await coursesOfReplacedCurriculum(tx, institutionId, programSlug, year)
    : new Set<number>();
  return courses
    .filter(({ id }) => !replaced.has(id))
    .map(({ id: _, ...known }) => ({ ...known, source: `${acronym} catalog` }));
}

async function ensureInstitution(tx: Transaction, file: CurriculumFile) {
  const existing = await findInstitution(tx, file.institution.acronym);
  if (existing) return existing;
  const [created] = await tx
    .insert(institution)
    .values(file.institution)
    .returning({ id: institution.id });
  return (created as { id: number }).id;
}

async function ensureDepartment(
  tx: Transaction,
  institutionId: number,
  file: CurriculumFile,
) {
  const [existing] = await tx
    .select({ id: department.id })
    .from(department)
    .where(
      and(
        eq(department.institutionId, institutionId),
        eq(department.acronym, file.department.acronym),
      ),
    );
  if (existing) return existing.id;
  const [created] = await tx
    .insert(department)
    .values({ institutionId, ...file.department })
    .returning({ id: department.id });
  return (created as { id: number }).id;
}

async function ensureProgram(
  tx: Transaction,
  institutionId: number,
  departmentId: number,
  slug: string,
  file: CurriculumFile,
) {
  const [existing] = await tx
    .select({ id: program.id })
    .from(program)
    .where(
      and(eq(program.institutionId, institutionId), eq(program.slug, slug)),
    );
  if (existing) return existing.id;
  const [created] = await tx
    .insert(program)
    .values({
      institutionId,
      departmentId,
      slug,
      name: file.program.name,
      siesCode: file.program.siesCode ?? null,
      demreCode: file.program.demreCode ?? null,
      schedule: file.program.schedule,
    })
    .returning({ id: program.id });
  return (created as { id: number }).id;
}

async function ensureCourses(
  tx: Transaction,
  institutionId: number,
  file: CurriculumFile,
  replace: boolean,
) {
  const insert = tx.insert(course).values(
    file.courses.map((fileCourse) => ({
      institutionId,
      code: fileCourse.code.trim(),
      name: fileCourse.name,
      description: fileCourse.description || null,
      credits: fileCourse.credits,
    })),
  );
  await (replace
    ? insert.onConflictDoUpdate({
        target: [course.institutionId, course.code],
        set: {
          name: sql.raw("excluded.name"),
          credits: sql.raw("excluded.credits"),
        },
      })
    : insert.onConflictDoNothing());
  const stored = await tx
    .select({ id: course.id, code: course.code })
    .from(course)
    .where(eq(course.institutionId, institutionId));
  const idByCode = new Map(stored.map(({ id, code }) => [code, id]));
  return new Map(
    file.courses.map((fileCourse) => [
      fileCourse.id,
      idByCode.get(fileCourse.code.trim()) as number,
    ]),
  );
}

function parentsOf(groups: { id: number; children: number[] }[]) {
  return new Map(
    groups.flatMap(({ id, children }) => children.map((child) => [child, id])),
  );
}

async function upsertCurriculum(
  tx: Transaction,
  programId: number,
  file: CurriculumFile,
  { publish, replace }: { publish: boolean; replace: boolean },
) {
  const values = {
    version: file.curriculum.version ?? null,
  };
  const [existing] = await tx
    .select({ id: curriculum.id })
    .from(curriculum)
    .where(
      and(
        eq(curriculum.programId, programId),
        eq(curriculum.year, file.curriculum.year),
      ),
    );
  if (!existing) {
    const [created] = await tx
      .insert(curriculum)
      .values({
        programId,
        year: file.curriculum.year,
        status: publish ? "published" : "draft",
        ...values,
      })
      .returning({ id: curriculum.id });
    return (created as { id: number }).id;
  }
  if (!replace) throw new ExistingCurriculum(existing.id);

  await tx
    .update(curriculum)
    .set(publish ? { ...values, status: "published" } : values)
    .where(eq(curriculum.id, existing.id));
  await tx.delete(area).where(eq(area.curriculumId, existing.id));
  await tx.delete(track).where(eq(track.curriculumId, existing.id));
  await tx
    .delete(curriculumCourse)
    .where(eq(curriculumCourse.curriculumId, existing.id));
  return existing.id;
}

async function insertCurriculum(
  tx: Transaction,
  file: CurriculumFile,
  { programSlug, publish = false, replace = false }: ImportOptions,
) {
  const institutionId = await ensureInstitution(tx, file);
  const departmentId = await ensureDepartment(tx, institutionId, file);
  const programId = await ensureProgram(
    tx,
    institutionId,
    departmentId,
    programSlug,
    file,
  );

  const curriculumId = await upsertCurriculum(tx, programId, file, {
    publish,
    replace,
  });

  const courseIds = await ensureCourses(tx, institutionId, file, replace);
  const curriculumCourses = await tx
    .insert(curriculumCourse)
    .values(
      file.courses.map((fileCourse) => ({
        curriculumId,
        courseId: courseIds.get(fileCourse.id) as number,
        duration: fileCourse.duration,
        prerequisiteCredits: fileCourse.prerequisiteCredits,
        isElective: fileCourse.isElective,
      })),
    )
    .returning({
      id: curriculumCourse.id,
      courseId: curriculumCourse.courseId,
    });
  const curriculumCourseIdByCourse = new Map(
    curriculumCourses.map(({ id, courseId }) => [courseId, id]),
  );
  const curriculumCourseOf = (fileCourseId: number) =>
    curriculumCourseIdByCourse.get(
      courseIds.get(fileCourseId) as number,
    ) as number;

  const prerequisites = file.courses.flatMap((fileCourse) =>
    [...new Set(fileCourse.prerequisiteIds)].map((requiredId) => ({
      curriculumId,
      curriculumCourseId: curriculumCourseOf(fileCourse.id),
      requiredCurriculumCourseId: curriculumCourseOf(requiredId),
    })),
  );
  if (prerequisites.length > 0) {
    await tx.insert(prerequisite).values(prerequisites);
  }

  if (file.curriculum.structure.length > 0) {
    await tx.insert(slot).values(
      file.curriculum.structure.map((fileSlot) => ({
        curriculumId,
        curriculumCourseId: curriculumCourseOf(fileSlot.courseId),
        programYear: fileSlot.year,
        term: fileSlot.term,
        position: fileSlot.position,
      })),
    );
  }

  const areaIds = new Map<number, number>();
  for (const fileArea of file.areas) {
    const [inserted] = await tx
      .insert(area)
      .values({ curriculumId, name: fileArea.name, color: fileArea.color })
      .returning({ id: area.id });
    areaIds.set(fileArea.id, (inserted as { id: number }).id);
  }
  const areaParents = parentsOf(
    file.areas.map(({ id, subareaIds }) => ({ id, children: subareaIds })),
  );
  for (const [child, parent] of areaParents) {
    await tx
      .update(area)
      .set({ parentAreaId: areaIds.get(parent) })
      .where(eq(area.id, areaIds.get(child) as number));
  }
  const areaCourses = file.areas.flatMap((fileArea) =>
    [...new Set(fileArea.courseIds)].map((courseId) => ({
      curriculumId,
      areaId: areaIds.get(fileArea.id) as number,
      curriculumCourseId: curriculumCourseOf(courseId),
    })),
  );
  if (areaCourses.length > 0) {
    await tx.insert(areaCourse).values(areaCourses);
  }

  const trackIds = new Map<number, number>();
  for (const fileTrack of file.curriculum.plans) {
    const [inserted] = await tx
      .insert(track)
      .values({
        curriculumId,
        name: fileTrack.name,
        description: fileTrack.description || null,
        requiredCredits:
          fileTrack.requiredCredits < 0 ? null : fileTrack.requiredCredits,
        credentialType: fileTrack.credential?.type ?? null,
        credentialName: fileTrack.credential?.name ?? null,
      })
      .returning({ id: track.id });
    trackIds.set(fileTrack.id, (inserted as { id: number }).id);
  }
  const trackParents = parentsOf(
    file.curriculum.plans.map(({ id, subplanIds }) => ({
      id,
      children: subplanIds,
    })),
  );
  for (const [child, parent] of trackParents) {
    await tx
      .update(track)
      .set({ parentTrackId: trackIds.get(parent) })
      .where(eq(track.id, trackIds.get(child) as number));
  }
  const trackCourses = file.curriculum.plans.flatMap((fileTrack) =>
    [...new Set(fileTrack.courseIds)].map((courseId) => ({
      curriculumId,
      trackId: trackIds.get(fileTrack.id) as number,
      curriculumCourseId: curriculumCourseOf(courseId),
    })),
  );
  if (trackCourses.length > 0) {
    await tx.insert(trackCourse).values(trackCourses);
  }

  return curriculumId;
}

export async function importCurriculum(
  db: Database,
  file: unknown,
  options: ImportOptions,
): Promise<ImportResult> {
  try {
    const curriculumId = await db.transaction(async (tx) => {
      const problems = validateCurriculum(
        file,
        await knownCoursesOf(tx, file, options),
      );
      if (problems.length > 0) throw new RejectedFile(problems);
      return insertCurriculum(tx, file as CurriculumFile, options);
    });
    return { ok: true, curriculumId };
  } catch (error) {
    if (error instanceof RejectedFile) {
      return { ok: false, problems: error.problems };
    }
    if (error instanceof ExistingCurriculum) {
      return { ok: false, existingCurriculumId: error.curriculumId };
    }
    throw error;
  }
}
