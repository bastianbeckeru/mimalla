"use client";

import { TriangleAlert, X } from "lucide-react";
import type { ReactNode } from "react";
import { getCourseColor, getTextColor } from "@/builder/colors";
import { getPeriodTitle } from "@/builder/periods";
import { getMisplacedPrerequisiteIds } from "@/builder/prerequisites";
import { AreaSwatch } from "@/components/curriculum/areas-legend";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import type { Course, Curriculum } from "@/types/builder";

type RelatedCourse = { course: Course; isMisplaced: boolean };

export default function CourseDetails({
  curriculum,
  course,
  onSelectCourse,
  onClose,
}: {
  curriculum: Curriculum;
  course: Course;
  onSelectCourse: (courseId: number) => void;
  onClose: () => void;
}) {
  const area = curriculum.areas.find(({ id }) => id === course.areaId);
  const color = getCourseColor(curriculum, course);
  const [firstSlot] = course.slots;
  const misplacedIds = getMisplacedPrerequisiteIds(curriculum, course.id);
  const tracks = curriculum.tracks.filter((track) =>
    course.trackIds.includes(track.id),
  );

  const prerequisites = curriculum.courses
    .filter(({ id }) => course.prerequisiteIds.includes(id))
    .map((prerequisite) => ({
      course: prerequisite,
      isMisplaced: misplacedIds.includes(prerequisite.id),
    }));
  const successors = curriculum.courses
    .filter(({ prerequisiteIds }) => prerequisiteIds.includes(course.id))
    .map((successor) => ({
      course: successor,
      isMisplaced: getMisplacedPrerequisiteIds(
        curriculum,
        successor.id,
      ).includes(course.id),
    }));

  return (
    <div className="flex min-h-full flex-col">
      <div className="relative flex flex-col gap-3 px-6 pt-5 pb-5">
        <p className="flex items-center gap-2 pr-8 text-muted-foreground text-xs">
          <AreaSwatch color={area?.color} />
          <span className="truncate">{area?.name ?? "Sin área"}</span>
        </p>
        <h2 className="font-heading font-semibold text-xl">{course.name}</h2>
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
          {course.code && (
            <Badge
              className="font-mono"
              style={{ backgroundColor: color, color: getTextColor(color) }}
            >
              {course.code}
            </Badge>
          )}
          <span>{course.credits} créditos</span>
          {firstSlot && (
            <>
              <span aria-hidden>·</span>
              <span>{getPeriodTitle(curriculum.termSystem, firstSlot)}</span>
            </>
          )}
          {course.isElective && <Badge variant="secondary">Electivo</Badge>}
        </div>
        {tracks.length > 0 && (
          <p className="text-muted-foreground text-xs">
            {tracks.map((track) => track.name).join(" · ")}
          </p>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-muted-foreground"
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <Separator />
      <div className="flex flex-col gap-6 px-4 py-5">
        <RelatedCourses
          title="Requiere"
          lineColor="var(--connection-prerequisite)"
          curriculum={curriculum}
          related={prerequisites}
          misplacedHint="Se dicta en la misma columna o después."
          onSelectCourse={onSelectCourse}
        >
          {course.prerequisiteCredits > 0 && (
            <p className="px-2 text-muted-foreground text-sm">
              {course.prerequisiteCredits} créditos aprobados
            </p>
          )}
        </RelatedCourses>
        <RelatedCourses
          title="Habilita"
          lineColor="var(--connection-successor)"
          curriculum={curriculum}
          related={successors}
          misplacedHint="Se dicta en la misma columna o antes."
          onSelectCourse={onSelectCourse}
        />
      </div>
    </div>
  );
}

function RelatedCourses({
  title,
  lineColor,
  curriculum,
  related,
  misplacedHint,
  onSelectCourse,
  children,
}: {
  title: string;
  lineColor: string;
  curriculum: Curriculum;
  related: RelatedCourse[];
  misplacedHint: string;
  onSelectCourse: (courseId: number) => void;
  children?: ReactNode;
}) {
  const isEmpty = related.length === 0 && !children;

  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 px-2 font-semibold text-muted-foreground text-xs uppercase tracking-wide">
        <span
          aria-hidden
          className="h-0.5 w-3 rounded-full"
          style={{ backgroundColor: lineColor }}
        />
        {title}
        <span className="font-normal">{related.length}</span>
      </h3>
      {children}
      {isEmpty && <p className="px-2 text-muted-foreground text-sm">Ninguno</p>}
      {related.length > 0 && (
        <ItemGroup className="gap-0.5">
          {related.map(({ course, isMisplaced }) => {
            const [firstSlot] = course.slots;
            return (
              <Item
                key={course.id}
                size="xs"
                render={
                  <button
                    type="button"
                    onClick={() => onSelectCourse(course.id)}
                  />
                }
                className="text-left hover:bg-muted"
              >
                <ItemMedia>
                  <AreaSwatch color={getCourseColor(curriculum, course)} />
                </ItemMedia>
                <ItemContent className="min-w-0">
                  <ItemTitle className="w-full truncate">
                    {course.name}
                  </ItemTitle>
                  {isMisplaced ? (
                    <ItemDescription className="flex items-center gap-1 text-warning">
                      <TriangleAlert className="size-3 shrink-0" />
                      {misplacedHint}
                    </ItemDescription>
                  ) : (
                    firstSlot && (
                      <ItemDescription>
                        {getPeriodTitle(curriculum.termSystem, firstSlot)}
                      </ItemDescription>
                    )
                  )}
                </ItemContent>
              </Item>
            );
          })}
        </ItemGroup>
      )}
    </section>
  );
}
