import type { Problem } from "@/types/validation";

export type KnownCourse = {
  id?: number;
  code: string;
  name: string;
  credits: number;
  source: string;
};

type Entity = Record<string, unknown>;

type ParsedFile = {
  root: Entity;
  curriculum: Entity;
  courses: Entity[];
  slots: Entity[];
  areas: Entity[];
  tracks: Entity[];
};

function entity(value: unknown): Entity {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Entity)
    : {};
}

function entities(value: unknown): Entity[] {
  return Array.isArray(value)
    ? value.filter(
        (item): item is Entity => typeof item === "object" && item !== null,
      )
    : [];
}

function ids(value: unknown): number[] {
  return Array.isArray(value) ? value.filter(Number.isInteger) : [];
}

function code(course: Entity) {
  return typeof course.code === "string" ? course.code.trim() : "";
}

function describeCourse(course: Entity) {
  const label = [code(course), course.name].filter(Boolean).join(" ");
  return `course ${course.id} (${label})`;
}

function missingCourseProblems({
  courses,
  slots,
  areas,
  tracks,
}: ParsedFile): Problem[] {
  const courseIds = new Set(courses.map((course) => course.id));
  const missingCourses = (references: unknown) =>
    ids(references).filter((id) => !courseIds.has(id));
  const problems: Problem[] = [];

  for (const course of courses) {
    const missing = missingCourses(course.prerequisiteIds);
    if (missing.length > 0) {
      problems.push({
        rule: "missing-course",
        message: `${describeCourse(course)} lists missing prerequisites: ${missing.join(", ")}`,
      });
    }
  }

  for (const slot of slots) {
    if (missingCourses([slot.courseId]).length > 0) {
      problems.push({
        rule: "missing-course",
        message: `slot ${slot.id} places missing course ${slot.courseId}`,
      });
    }
  }

  const groups = [
    ...areas.map((group) => ({ kind: "area", group })),
    ...tracks.map((group) => ({ kind: "track", group })),
  ];
  for (const { kind, group } of groups) {
    const missing = missingCourses(group.courseIds);
    if (missing.length > 0) {
      problems.push({
        rule: "missing-course",
        message: `${kind} ${group.id} (${group.name}) lists missing courses: ${missing.join(", ")}`,
      });
    }
  }

  return problems;
}

function codeProblems({ courses }: ParsedFile): Problem[] {
  const problems: Problem[] = [];
  const coursesByCode = new Map<string, Entity[]>();

  for (const course of courses) {
    if (code(course) === "") {
      if (typeof course.code === "string") {
        problems.push({
          rule: "empty-code",
          message: `${describeCourse(course)} has an empty code`,
        });
      }
      continue;
    }
    coursesByCode.set(code(course), [
      ...(coursesByCode.get(code(course)) ?? []),
      course,
    ]);
  }

  for (const [sharedCode, sharing] of coursesByCode) {
    if (sharing.length > 1) {
      problems.push({
        rule: "duplicate-code",
        message: `courses ${sharing.map((course) => course.id).join(", ")} share the code ${sharedCode}`,
      });
    }
  }

  return problems;
}

function cycleProblems({ courses }: ParsedFile): Problem[] {
  const prerequisites = new Map<number, number[]>();
  for (const course of courses) {
    if (Number.isInteger(course.id)) {
      prerequisites.set(course.id as number, ids(course.prerequisiteIds));
    }
  }

  const index = new Map<number, number>();
  const lowLink = new Map<number, number>();
  const stack: number[] = [];
  const onStack = new Set<number>();
  const cycles: number[][] = [];

  const visit = (id: number) => {
    index.set(id, index.size);
    lowLink.set(id, index.get(id) as number);
    stack.push(id);
    onStack.add(id);

    for (const prerequisite of prerequisites.get(id) ?? []) {
      if (!prerequisites.has(prerequisite)) continue;
      if (!index.has(prerequisite)) {
        visit(prerequisite);
        lowLink.set(
          id,
          Math.min(
            lowLink.get(id) as number,
            lowLink.get(prerequisite) as number,
          ),
        );
      } else if (onStack.has(prerequisite)) {
        lowLink.set(
          id,
          Math.min(
            lowLink.get(id) as number,
            index.get(prerequisite) as number,
          ),
        );
      }
    }

    if (lowLink.get(id) !== index.get(id)) return;
    const component: number[] = [];
    let member: number | undefined;
    do {
      member = stack.pop() as number;
      onStack.delete(member);
      component.push(member);
    } while (member !== id);

    const isSelfLoop = prerequisites.get(id)?.includes(id) ?? false;
    if (component.length > 1 || isSelfLoop) {
      cycles.push(component.sort((a, b) => a - b));
    }
  };

  for (const id of prerequisites.keys()) {
    if (!index.has(id)) visit(id);
  }

  return cycles
    .sort((a, b) => (a[0] as number) - (b[0] as number))
    .map((cycle) => ({
      rule: "prerequisite-cycle",
      message: `prerequisite cycle among courses ${cycle.join(", ")}`,
    }));
}

function overlappingSlotProblems({ slots }: ParsedFile): Problem[] {
  const slotsByPlace = new Map<string, Entity[]>();
  for (const slot of slots) {
    const place = `program year ${slot.year}, term ${slot.term} and position ${slot.position}`;
    slotsByPlace.set(place, [...(slotsByPlace.get(place) ?? []), slot]);
  }

  return [...slotsByPlace]
    .filter(([, sharing]) => sharing.length > 1)
    .map(([place, sharing]) => ({
      rule: "overlapping-slots",
      message: `slots ${sharing.map((slot) => slot.id).join(", ")} share ${place}`,
    }));
}

type FieldRule = { optional?: boolean; isValid: (value: unknown) => boolean };

const isText = (value: unknown) => typeof value === "string";
const isInteger = (value: unknown) => Number.isInteger(value);
const isCount = (value: unknown) => isInteger(value) && (value as number) >= 0;
const isOrdinal = (value: unknown) =>
  isInteger(value) && (value as number) >= 1;
const isList = (value: unknown) => Array.isArray(value);
const isIdList = (value: unknown) =>
  Array.isArray(value) && value.every(isInteger);
const isObject = (value: unknown) =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const credentialTypes = [
  "PROFESSIONAL",
  "ACADEMIC",
  "TECHNICAL",
  "CERTIFICATE",
];

const nameAndAcronym: Record<string, FieldRule> = {
  name: { isValid: isText },
  acronym: { isValid: isText },
};

const fieldRules = {
  root: {
    institution: { isValid: isObject },
    department: { isValid: isObject },
    program: { isValid: isObject },
    curriculum: { isValid: isObject },
    areas: { isValid: isList },
    courses: { isValid: isList },
  },
  program: {
    name: { isValid: isText },
    siesCode: { optional: true, isValid: isText },
    demreCode: { optional: true, isValid: isInteger },
    schedule: {
      isValid: (value: unknown) => value === "DAYTIME" || value === "EVENING",
    },
  },
  curriculum: {
    version: { optional: true, isValid: isText },
    year: { isValid: isInteger },
    structure: { isValid: isList },
    plans: { isValid: isList },
  },
  slot: {
    id: { isValid: isInteger },
    year: { isValid: isOrdinal },
    term: {
      isValid: (value: unknown) =>
        isInteger(value) && (value as number) >= 1 && (value as number) <= 4,
    },
    position: { isValid: isOrdinal },
    courseId: { isValid: isInteger },
  },
  track: {
    id: { isValid: isInteger },
    name: { isValid: isText },
    description: { optional: true, isValid: isText },
    requiredCredits: { isValid: isInteger },
    courseIds: { isValid: isIdList },
    subplanIds: { isValid: isIdList },
    credential: {
      isValid: (value: unknown) =>
        value === null ||
        (isObject(value) &&
          credentialTypes.includes((value as Entity).type as string) &&
          isText((value as Entity).name)),
    },
  },
  area: {
    id: { isValid: isInteger },
    name: { isValid: isText },
    color: { isValid: isText },
    courseIds: { isValid: isIdList },
    subareaIds: { isValid: isIdList },
  },
  course: {
    id: { isValid: isInteger },
    code: { isValid: isText },
    name: { isValid: isText },
    description: { optional: true, isValid: isText },
    credits: { isValid: isCount },
    duration: { isValid: isOrdinal },
    prerequisiteCredits: { isValid: isCount },
    prerequisiteIds: { isValid: isIdList },
    isElective: { isValid: (value: unknown) => typeof value === "boolean" },
  },
} satisfies Record<string, Record<string, FieldRule>>;

function checkFields(
  subject: string,
  target: Entity,
  rules: Record<string, FieldRule>,
): Problem[] {
  return Object.entries(rules).flatMap(([field, rule]): Problem[] => {
    const value = target[field];
    if (value === undefined || (rule.optional && value === null)) {
      return rule.optional
        ? []
        : [
            {
              rule: "missing-field",
              message: `${subject} is missing ${field}`,
            },
          ];
    }
    return rule.isValid(value)
      ? []
      : [
          {
            rule: "invalid-field",
            message: `${subject} has an invalid ${field}: ${JSON.stringify(value)}`,
          },
        ];
  });
}

function fieldProblems({
  root,
  curriculum,
  slots,
  tracks,
  areas,
  courses,
}: ParsedFile): Problem[] {
  const named = (kind: string, group: Entity) =>
    `${kind} ${group.id} (${group.name})`;
  return [
    ...checkFields("file", root, fieldRules.root),
    ...checkFields("institution", entity(root.institution), nameAndAcronym),
    ...checkFields("department", entity(root.department), nameAndAcronym),
    ...checkFields("program", entity(root.program), fieldRules.program),
    ...checkFields("curriculum", curriculum, fieldRules.curriculum),
    ...slots.flatMap((slot) =>
      checkFields(`slot ${slot.id}`, slot, fieldRules.slot),
    ),
    ...tracks.flatMap((track) =>
      checkFields(named("track", track), track, fieldRules.track),
    ),
    ...areas.flatMap((area) =>
      checkFields(named("area", area), area, fieldRules.area),
    ),
    ...courses.flatMap((course) =>
      checkFields(describeCourse(course), course, fieldRules.course),
    ),
  ];
}

function sharedCourseProblems(
  { courses }: ParsedFile,
  knownCourses: KnownCourse[],
): Problem[] {
  return courses.flatMap((course) =>
    knownCourses
      .filter(
        (known) =>
          (known.id !== undefined && known.id === course.id) ||
          (code(course) !== "" && known.code.trim() === code(course)),
      )
      .flatMap((known): Problem[] => {
        const differences = (["code", "name", "credits"] as const)
          .filter((field) => course[field] !== known[field])
          .map(
            (field) =>
              `${field} (${JSON.stringify(course[field])} vs ${JSON.stringify(known[field])})`,
          );
        return differences.length === 0
          ? []
          : [
              {
                rule: "shared-course-conflict",
                message: `${describeCourse(course)} disagrees with ${known.source} on ${differences.join(", ")}`,
              },
            ];
      }),
  );
}

function parse(file: unknown): ParsedFile {
  const root = entity(file);
  const curriculum = entity(root.curriculum);
  return {
    root,
    curriculum,
    courses: entities(root.courses),
    slots: entities(curriculum.structure),
    areas: entities(root.areas),
    tracks: entities(curriculum.plans),
  };
}

export function validateCurriculum(
  file: unknown,
  knownCourses: KnownCourse[] = [],
): Problem[] {
  const parsed = parse(file);
  return [
    ...fieldProblems(parsed),
    ...missingCourseProblems(parsed),
    ...codeProblems(parsed),
    ...cycleProblems(parsed),
    ...overlappingSlotProblems(parsed),
    ...sharedCourseProblems(parsed, knownCourses),
  ];
}

type CurriculumFile = { path: string; content: unknown };

export function validateCurriculumFiles(files: CurriculumFile[]) {
  const institutionOf = ({ content }: CurriculumFile) =>
    entity(entity(content).institution).acronym;
  const coursesOf = (file: CurriculumFile): KnownCourse[] =>
    parse(file.content).courses.flatMap((course) =>
      isInteger(course.id) &&
      isText(course.code) &&
      isText(course.name) &&
      typeof course.credits === "number"
        ? [
            {
              id: course.id as number,
              code: course.code as string,
              name: course.name as string,
              credits: course.credits,
              source: file.path,
            },
          ]
        : [],
    );

  return files.map((file) => ({
    path: file.path,
    problems: validateCurriculum(
      file.content,
      files
        .filter(
          (other) =>
            other !== file && institutionOf(other) === institutionOf(file),
        )
        .flatMap(coursesOf),
    ),
  }));
}
