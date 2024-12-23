"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { useCurriculumStore } from "@/stores/curriculum";
import { hexToRgba, parseHexColor } from "@/utils/colors";
import { cn } from "@/lib/utils";
import { Check, Ghost, Minus } from "lucide-react";

type CourseDialogProps = {
  isOpen: boolean;
  onOpenChange: () => void;
  course?: {
    id: number;
    isElective: boolean;
    name: string;
    code: string | null;
    description: string | null;
    duration: number;
    credits: number;
    prerequisiteIds: number[];
    subsequentIds: number[];
  } | null;
  color?: string;
};

export default function CourseDialog({
  isOpen,
  onOpenChange,
  course,
  color = "#fafafa",
}: CourseDialogProps) {
  const { progress } = useCurriculumStore();
  const rgbaColor = hexToRgba(parseHexColor(color), 0.2);

  const style = {
    backgroundColor: rgbaColor,
  };
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent tabIndex={-1} className="min-h-64 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {course?.name ?? `Curso`}
          </DialogTitle>
          <div className="mt-1 flex flex-row items-center space-x-2 text-sm text-muted-foreground">
            <p className="min-w-32 rounded-md px-1 py-px" style={style}>
              Código: <span className="">{course?.code}</span>
            </p>
            <p className="min-w-32 rounded-md px-1 py-px">
              {course?.credits} Créditos
            </p>
          </div>
        </DialogHeader>

        <div className="flex size-full min-h-48 flex-col">
          {course?.prerequisiteIds.map((id, pIndex) => (
            <p key={pIndex} className="text-sm text-muted-foreground">
              {id}
            </p>
          ))}
          {course?.subsequentIds.map((id, pIndex) => (
            <p key={pIndex} className="text-sm text-muted-foreground">
              {id}
            </p>
          ))}
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
            "flex items-center justify-center",
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
