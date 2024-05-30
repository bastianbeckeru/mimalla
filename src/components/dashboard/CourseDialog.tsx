"use client";

import type { CourseProps } from "@/types/curriculum";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Check, Ghost, Minus } from "lucide-react";
import { useCurriculumStore } from "@/stores/curriculum";
import { hexToRgba } from "@/utils/colorFunctions";
import { cn } from "@/lib/utils";

type Props = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  course: CourseProps | null;
  setSelectedCourse: (course: CourseProps | null) => void;
  color: string;
  setSelectedColor: (color: string) => void;
};

export default function CourseDialog({
  isOpen,
  setIsOpen,
  course,
  setSelectedCourse,
  color,
}: Props) {
  const { progress } = useCurriculumStore();
  const rgbaColor = hexToRgba(color, 0.2);

  const style = {
    backgroundColor: rgbaColor,
  };
  console.log("HOLA");
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        setIsOpen(open);
        setTimeout(() => {
          if (!open) setSelectedCourse(null);
        }, 200);
      }}
    >
      <DialogContent tabIndex={-1} className="min-h-64 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {course?.name ?? `Curso`}
          </DialogTitle>
          <div className="mt-1 flex flex-row items-center space-x-2 text-sm text-muted-foreground">
            <p className="rounded-md px-1 py-px" style={style}>
              Código: {course?.code ?? "-------"}
            </p>
            <p>{course?.credits ?? "0"} Créditos</p>
          </div>
        </DialogHeader>

        <div className="flex size-full min-h-48 flex-col">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <RelatedCourses
              relation="Prerrequisitos"
              relatedCourses={course?.prerequisiteCourses}
              progress={progress}
            >
              {course && course.prerequisiteCredits > 0 ? (
                <li className="flex flex-row items-center justify-between space-x-1 px-2">
                  <p className="text-sm">
                    {course?.prerequisiteCredits} Créditos
                  </p>
                  {progress && course ? (
                    progress.earnedCredits >= course.prerequisiteCredits ? (
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
              relatedCourses={course?.dependentCourses}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

type RelatedCoursesProps = {
  relation: string;
  relatedCourses:
    | {
        code: string | null;
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

            {relatedCourses?.map((course, cIndex) => {
              const isApproved = course.code
                ? progress?.approvedCourses?.some((approvedCourse) =>
                    approvedCourse.startsWith(course.code!),
                  )
                : false;

              return (
                <li
                  key={cIndex}
                  className="flex flex-row items-center justify-between space-x-1 px-2"
                >
                  <p className="text-sm">{course.name}</p>
                  <div className="flex flex-row space-x-1">
                    <p className="text-xs text-muted-foreground">
                      ({course.code ?? "-------"})
                    </p>
                    {progress?.approvedCourses !== undefined ? (
                      isApproved ? (
                        <Check className="size-4 text-green-500" />
                      ) : (
                        <Minus className="size-4 text-muted-foreground" />
                      )
                    ) : null}
                  </div>
                </li>
              );
            })}
          </>
        )}
      </ul>
    </div>
  );
}
