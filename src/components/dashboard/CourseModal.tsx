"use client";

import type { ModifiedEnrollmentProps } from "@/types/curriculum";
import { DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Check, Minus } from "lucide-react";
import { useCurriculumStore } from "@/stores/curriculum";
import { hexToRgba } from "@/utils/colorFunctions";

type Props = {
  enrollment: ModifiedEnrollmentProps;
  color: string;
};

export default function CourseModal({ enrollment, color }: Props) {
  const approvedCourses = useCurriculumStore().progress.approvedCourses;
  const rgbaColor = hexToRgba(color, 0.15);

  const style = {
    backgroundColor: rgbaColor,
  }

  return (
    <DialogContent tabIndex={-1} className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-2xl">
          {enrollment.course?.name ?? `Curso`}
        </DialogTitle>
        <div className="mt-1 flex flex-row items-center space-x-2 text-sm text-muted-foreground">
          {/* Intentar obtener el RGB color del área, si es posible, obtenerlo desde "Course" y luego pasarlo como prop a CourseModal. Luego, aplicar el "/ {transparency}". (OJO: Recordar que el contraste es importante.)
           */}
          <p className="rounded-md px-1 py-px" style={style}>
            Código: {enrollment.course?.code ?? "-------"}
          </p>
          <p>{enrollment.course?.credits ?? "0"} Créditos</p>
        </div>
      </DialogHeader>

      <div className="flex size-full min-h-48 flex-col">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <RelatedCourses
            relation="Prerrequisitos"
            courses={enrollment.course?.prerequisiteCourses}
            approvedCourses={approvedCourses}
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
  approvedCourses?: string[];
};

function RelatedCourses({
  relation,
  courses,
  approvedCourses,
}: RelatedCoursesProps) {
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
            <div className="flex flex-row space-x-1">
              <p className="text-xs text-muted-foreground">({course.code})</p>
              {approvedCourses !== undefined ? (
                approvedCourses?.includes(course.code) ? (
                  <Check className="size-4 text-green-500" />
                ) : (
                  <Minus className="size-4 text-muted-foreground" />
                )
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
