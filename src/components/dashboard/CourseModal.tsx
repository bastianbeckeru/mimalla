"use client";

import type { ModifiedEnrollmentProps } from "@/types/curriculum";
import { DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";

type Props = {
  enrollment: ModifiedEnrollmentProps;
};

export default function CourseModal({ enrollment }: Props) {
  return (
    <DialogContent tabIndex={-1} className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-2xl">
          {enrollment.course?.name ?? `Curso`}
        </DialogTitle>
        <p className="text-sm text-muted-foreground">
          {" "}
          Código: {enrollment.course?.code ?? "XYZ0000"}
          {" | "}
          {enrollment.course?.credits ?? "0"} Créditos
        </p>
      </DialogHeader>

      <div className="flex size-full min-h-48 flex-col">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <RelatedCourses
            relation="Prerrequisitos"
            courses={enrollment.course?.prerequisiteCourses}
          />
          <RelatedCourses
            relation="Desbloquea"
            courses={enrollment.course?.dependentCourses}
          />
        </div>
      </div>
    </DialogContent>
  );
}

type RelatedCoursesProps = {
  relation: string;
  courses:
    | {
        code: string;
        name: string;
      }[]
    | undefined;
};

function RelatedCourses({ relation, courses }: RelatedCoursesProps) {
  return (
    <div>
      <h2 className="font-bold">{relation}</h2>
      <ul className="min-h-32 rounded-lg border p-2">
        {courses?.map((course, cIndex) => (
          <li
            key={course.code + cIndex}
            className="flex flex-row items-center justify-between space-x-1 px-2"
          >
            <p className="text-sm">{course.name}</p>
            <p className="text-xs text-muted-foreground">({course.code})</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
