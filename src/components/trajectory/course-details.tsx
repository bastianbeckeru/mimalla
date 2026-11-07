"use client";

import { cn } from "cn";
import { Check, ChevronRight, Circle } from "lucide-react";
import { getCourseColor } from "@/curriculum/colors";
import type { Course, Curriculum } from "@/types/curriculum";
import type { PanelPrerequisite } from "@/types/trajectory";

function RelationRow({
  name,
  icon,
  detail,
  isDimmed = false,
  onOpen,
}: {
  name: string;
  icon?: React.ReactNode;
  detail?: string;
  isDimmed?: boolean;
  onOpen?: () => void;
}) {
  const content = (
    <>
      {icon}
      <span
        className={cn(
          "min-w-0 flex-1 truncate",
          isDimmed && "text-muted-foreground",
        )}
      >
        {name}
      </span>
      {detail && (
        <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
          {detail}
        </span>
      )}
      {onOpen && (
        <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
      )}
    </>
  );

  return onOpen ? (
    <button
      type="button"
      className="flex min-h-10 w-full items-center gap-2.5 text-left"
      onClick={onOpen}
    >
      {content}
    </button>
  ) : (
    <div className="flex min-h-10 items-center gap-2.5">{content}</div>
  );
}

export function Prerequisites({
  prerequisites,
  canOpenCourse,
  onOpenCourse,
}: {
  prerequisites: PanelPrerequisite[];
  canOpenCourse: (courseId: number) => boolean;
  onOpenCourse: (courseId: number) => void;
}) {
  if (prerequisites.length === 0)
    return <p className="text-muted-foreground text-sm">Ninguno</p>;

  return (
    <ul className="text-sm">
      {prerequisites.map(({ key, name, isMet, courseId, detail }) => (
        <li key={key}>
          <RelationRow
            name={name}
            detail={detail}
            isDimmed={isMet}
            icon={
              isMet ? (
                <Check
                  aria-label="Cumplido"
                  className="size-3.5 shrink-0 text-success"
                />
              ) : (
                <Circle
                  aria-label="Pendiente"
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
              )
            }
            onOpen={
              courseId !== undefined && canOpenCourse(courseId)
                ? () => onOpenCourse(courseId)
                : undefined
            }
          />
        </li>
      ))}
    </ul>
  );
}

export default function CourseDetails({
  course,
  curriculum,
  prerequisites,
  successors,
  canOpenCourse,
  onOpenCourse,
}: {
  course: Course;
  curriculum: Curriculum;
  prerequisites: PanelPrerequisite[];
  successors: Course[];
  canOpenCourse: (courseId: number) => boolean;
  onOpenCourse: (courseId: number) => void;
}) {
  const area = curriculum.areas.find(({ id }) => id === course.areaId);

  return (
    <div className="space-y-5 text-sm">
      <div className="space-y-1.5">
        <h3 className="text-muted-foreground">Área</h3>
        <p className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[3px] ring-1 ring-foreground/15"
            style={{ backgroundColor: getCourseColor(curriculum, course) }}
          />
          <span className="truncate">{area?.name ?? "Sin área"}</span>
        </p>
      </div>
      <div className="min-w-0 space-y-1">
        <h3 className="text-muted-foreground">Requiere</h3>
        <Prerequisites
          prerequisites={prerequisites}
          canOpenCourse={canOpenCourse}
          onOpenCourse={onOpenCourse}
        />
      </div>
      <div className="min-w-0 space-y-1">
        <h3 className="text-muted-foreground">Habilita</h3>
        {successors.length === 0 ? (
          <p className="text-muted-foreground">Ninguno</p>
        ) : (
          <ul>
            {successors.map((other) => (
              <li key={other.id}>
                <RelationRow
                  name={other.name}
                  onOpen={
                    canOpenCourse(other.id)
                      ? () => onOpenCourse(other.id)
                      : undefined
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
