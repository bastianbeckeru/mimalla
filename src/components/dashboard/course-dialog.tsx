"use client";

import { Check, Ghost, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Course, ExtendedCourse } from "@/types/curriculum";
import { hexToRgba, parseHexColor } from "@/utils/colors";

type CourseDialogProps = {
  isOpen: boolean;
  onOpenChange: () => void;
  courses: Map<number, Course>;
  course?: ExtendedCourse | null;
  color?: string;
  approvedCourseIds: number[];
  approvedCredits: number;
};

export default function CourseDialog({
  isOpen,
  onOpenChange,
  courses,
  course,
  color = "#fafafa",
  approvedCourseIds,
  approvedCredits,
}: CourseDialogProps) {
  const rgbaColor = hexToRgba(parseHexColor(color), 0.2);

  const style = {
    backgroundColor: rgbaColor,
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent tabIndex={-1} className="min-h-64 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-left text-xl">{course.name}</DialogTitle>
          <div className="mt-1 flex flex-row items-center space-x-2 text-muted-foreground text-sm">
            {course.code && (
              <p className="min-w-fit rounded-md px-2 py-px" style={style}>
                {course.code}
              </p>
            )}
            <p className="min-w-fit rounded-md py-px">
              {course.credits} créditos
            </p>
          </div>
        </DialogHeader>

        <div className="flex size-full min-h-48 flex-col gap-2 md:flex-row">
          <div className="rounded-md border md:w-1/2">
            <h2 className="border-b px-2 py-1 font-semibold text-muted-foreground">
              Prerequisitos
            </h2>
            <ul className="flex min-h-32 flex-col space-y-1 p-2">
              {course.prerequisiteIds.length > 0 ||
              course.prerequisiteCredits > 0 ? (
                <>
                  {course.prerequisiteCredits > 0 && (
                    <RelatedElement
                      name={`${course.prerequisiteCredits} créditos`}
                      code={null}
                      isChecked={course.prerequisiteCredits <= approvedCredits}
                    />
                  )}
                  {course.prerequisiteIds.map((id) => {
                    const isApproved = approvedCourseIds.includes(id);
                    const c = courses.get(id);

                    if (!c) return null;

                    return (
                      <RelatedElement
                        key={id}
                        name={c.name}
                        code={c.code}
                        isChecked={isApproved}
                      />
                    );
                  })}
                </>
              ) : (
                <div className="flex h-28 items-center justify-center">
                  <Ghost className="size-8 text-muted" />
                </div>
              )}
            </ul>
          </div>
          <div className="rounded-md border md:w-1/2">
            <h2 className="border-b px-2 py-1 font-semibold text-muted-foreground">
              Desbloquea
            </h2>
            <ul className="flex min-h-32 flex-col space-y-1 p-2">
              {course.subsequentIds.length > 0 ? (
                course.subsequentIds.map((id) => {
                  const isApproved = approvedCourseIds.includes(id);
                  const c = courses.get(id);

                  if (!c) return null;

                  return (
                    <RelatedElement
                      key={id}
                      name={c.name}
                      code={c.code}
                      isChecked={isApproved}
                    />
                  );
                })
              ) : (
                <div className="flex h-28 items-center justify-center">
                  <Ghost className="size-8 text-muted" />
                </div>
              )}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const RelatedElement = ({
  name,
  code,
  isChecked,
}: {
  name: string;
  code: string | null;
  isChecked: boolean;
}) => (
  <li className="flex flex-row items-center space-x-1 text-sm">
    <p className="flex-grow">{name}</p>
    {code && <p className="text-muted-foreground">({code})</p>}

    <div className="flex size-5 items-center justify-center">
      {isChecked ? (
        <Check className="size-4 text-green-500" />
      ) : (
        <Minus className="size-4 text-muted-foreground" />
      )}
    </div>
  </li>
);
