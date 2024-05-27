"use client";

import type { ModifiedEnrollmentProps } from "@/types/curriculum";
import { DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Check, Ghost, Minus } from "lucide-react";
import { useCurriculumStore } from "@/stores/curriculum";
import { hexToRgba } from "@/utils/colorFunctions";
import { cn } from "@/lib/utils";

type Props = {
  enrollment: ModifiedEnrollmentProps;
  color: string;
};

export default function CourseModal({ enrollment, color }: Props) {
  const { progress } = useCurriculumStore();
  const rgbaColor = hexToRgba(color, 0.2);

  const style = {
    backgroundColor: rgbaColor,
  };

  return (
    <DialogContent tabIndex={-1} className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle className="text-2xl">
          {enrollment.course?.name ?? `Curso`}
        </DialogTitle>
        <div className="mt-1 flex flex-row items-center space-x-2 text-sm text-muted-foreground">
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
            relatedCourses={enrollment.course?.prerequisiteCourses}
            progress={progress}
          >
            {enrollment.course && enrollment.course.prerequisiteCredits > 0 ? (
              <li className="flex flex-row items-center justify-between space-x-1 px-2">
                <p className="text-sm">
                  {enrollment.course?.prerequisiteCredits} Créditos
                </p>
                {progress && enrollment.course ? (
                  progress.earnedCredits >=
                  enrollment.course.prerequisiteCredits ? (
                    <Check className="size-4 text-green-500" />
                  ) : (
                    <Minus className="size-4 text-muted-foreground" />
                  )
                ) : null}
              </li>
            ) : null}
          </RelatedCourses>
          <RelatedCourses
            relation="Desbloquea"
            relatedCourses={enrollment.course?.dependentCourses}
          />
        </div>
      </div>
    </DialogContent>
  );
}

type RelatedCoursesProps = {
  relation: string;
  relatedCourses:
    | {
        code: string;
        name: string;
      }[]
    | undefined;
  progress?: {
    approvedCourses?: string[];
    earnedCredits?: number;
  };
  children?: React.ReactNode;
};

function RelatedCourses({
  relation,
  relatedCourses,
  progress,
  children,
}: RelatedCoursesProps) {
  return (
    <div>
      <h2 className="font-bold">{relation}</h2>
      <ul
        className={cn(
          "min-h-32 rounded-lg border p-2",
          !children &&
            relatedCourses?.length == 0 &&
            " flex items-center justify-center",
        )}
      >
        {!children && relatedCourses?.length == 0 ? (
          <Ghost className="size-5 text-muted" />
        ) : (
          <>
            {children}

            {relatedCourses?.map((course, cIndex) => (
              <li
                key={course.code + cIndex}
                className="flex flex-row items-center justify-between space-x-1 px-2"
              >
                <p className="text-sm">{course.name}</p>
                <div className="flex flex-row space-x-1">
                  <p className="text-xs text-muted-foreground">
                    ({course.code})
                  </p>
                  {progress?.approvedCourses !== undefined ? (
                    progress.approvedCourses.some((approvedCourse) =>
                      approvedCourse.startsWith(course.code),
                    ) ? (
                      <Check className="size-4 text-green-500" />
                    ) : (
                      <Minus className="size-4 text-muted-foreground" />
                    )
                  ) : null}
                </div>
              </li>
            ))}
          </>
        )}
      </ul>
    </div>
  );
}
