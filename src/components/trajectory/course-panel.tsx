"use client";

import { Check, RotateCcw, Trash2, X } from "lucide-react";
import { getCourseColor } from "@/builder/colors";
import {
  AdaptiveDialog,
  AdaptiveDialogBody,
  AdaptiveDialogContent,
  AdaptiveDialogDescription,
  AdaptiveDialogFooter,
  AdaptiveDialogHeader,
  AdaptiveDialogTitle,
} from "@/components/ui/adaptive-dialog";
import { Button } from "@/components/ui/button";
import type { Course, Curriculum } from "@/types/builder";
import type {
  Enrollment,
  EnrollmentStatus,
  TrajectoryProgress,
} from "@/types/trajectory";

export default function CoursePanel({
  open,
  enrollment,
  course,
  curriculum,
  progress,
  isAvailable,
  isEditing,
  onOpenChange,
  onSetStatus,
  onRemove,
}: {
  open: boolean;
  enrollment: Enrollment | null;
  course: Course | null;
  curriculum: Curriculum;
  progress: TrajectoryProgress;
  isAvailable: boolean;
  isEditing: boolean;
  onOpenChange: (open: boolean) => void;
  onSetStatus: (status: EnrollmentStatus) => void;
  onRemove: () => void;
}) {
  const area = curriculum.areas.find(({ id }) => id === course?.areaId);
  const prerequisites = (course?.prerequisiteIds ?? []).flatMap((id) => {
    const prerequisite = curriculum.courses.find((c) => c.id === id);
    return prerequisite ? [prerequisite] : [];
  });

  return (
    <AdaptiveDialog open={open} onOpenChange={onOpenChange}>
      <AdaptiveDialogContent className="sm:max-w-md">
        {course && enrollment && (
          <>
            <AdaptiveDialogHeader>
              <AdaptiveDialogTitle>{course.name}</AdaptiveDialogTitle>
              <AdaptiveDialogDescription>
                {[course.code, `${course.credits} créditos`]
                  .filter(Boolean)
                  .join(" · ")}
              </AdaptiveDialogDescription>
            </AdaptiveDialogHeader>
            <AdaptiveDialogBody>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Área</dt>
                <dd className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="size-2.5 shrink-0 rounded-[3px] ring-1 ring-foreground/15"
                    style={{
                      backgroundColor: getCourseColor(curriculum, course),
                    }}
                  />
                  <span className="truncate">{area?.name ?? "Sin área"}</span>
                </dd>
                <dt className="text-muted-foreground">Prerrequisitos</dt>
                <dd>
                  {prerequisites.length === 0 &&
                  course.prerequisiteCredits === 0 ? (
                    <span className="text-muted-foreground">Ninguno</span>
                  ) : (
                    <ul className="space-y-1">
                      {course.prerequisiteCredits > 0 && (
                        <Prerequisite
                          name={`${course.prerequisiteCredits} créditos aprobados`}
                          isApproved={
                            course.prerequisiteCredits <=
                            progress.approvedCredits
                          }
                        />
                      )}
                      {prerequisites.map((prerequisite) => (
                        <Prerequisite
                          key={prerequisite.id}
                          name={prerequisite.name}
                          isApproved={progress.approvedCourseIds.has(
                            prerequisite.id,
                          )}
                        />
                      ))}
                    </ul>
                  )}
                </dd>
              </dl>
            </AdaptiveDialogBody>
            <AdaptiveDialogFooter>
              {enrollment.status !== "PENDING" && (
                <Button
                  variant="outline"
                  onClick={() => onSetStatus("PENDING")}
                >
                  <RotateCcw />
                  Volver a pendiente
                </Button>
              )}
              {enrollment.status !== "FAILED" && (
                <Button variant="outline" onClick={() => onSetStatus("FAILED")}>
                  <X />
                  Marcar como reprobado
                </Button>
              )}
              {enrollment.status !== "APPROVED" && (
                <Button
                  disabled={!isAvailable}
                  onClick={() => onSetStatus("APPROVED")}
                >
                  <Check />
                  Marcar como aprobado
                </Button>
              )}
              {isEditing && (
                <Button variant="destructive" onClick={onRemove}>
                  <Trash2 />
                  Quitar curso
                </Button>
              )}
            </AdaptiveDialogFooter>
          </>
        )}
      </AdaptiveDialogContent>
    </AdaptiveDialog>
  );
}

function Prerequisite({
  name,
  isApproved,
}: {
  name: string;
  isApproved: boolean;
}) {
  return (
    <li className="flex items-center gap-2">
      {isApproved ? (
        <Check aria-label="Aprobado" className="size-4 shrink-0 text-success" />
      ) : (
        <span aria-hidden className="size-4 shrink-0" />
      )}
      <span className={isApproved ? undefined : "text-muted-foreground"}>
        {name}
      </span>
    </li>
  );
}
