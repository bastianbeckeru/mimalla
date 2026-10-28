"use client";

import { ArrowLeftRight } from "lucide-react";
import PropertyRow, {
  propertyControlClassName,
} from "@/components/builder/property-row";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Action, Course, TermSystem } from "@/types/builder";

const UNITS: Record<TermSystem, [string, string]> = {
  semester: ["semestre", "semestres"],
  annual: ["año", "años"],
};

export default function DurationSelect({
  course,
  maxDuration,
  termSystem,
  dispatch,
}: {
  course: Course;
  maxDuration: number;
  termSystem: TermSystem;
  dispatch: (action: Action) => void;
}) {
  const [singular, plural] = UNITS[termSystem];
  const items = Array.from(
    { length: Math.max(maxDuration, course.duration) },
    (_, index) => ({
      value: index + 1,
      label: `${index + 1} ${index === 0 ? singular : plural}`,
    }),
  );

  return (
    <PropertyRow
      icon={ArrowLeftRight}
      label="Duración"
      htmlFor="builder-course-duration"
    >
      <Select
        items={items}
        value={course.duration}
        onValueChange={(duration: number | null) => {
          if (duration !== null)
            dispatch({
              type: "editCourse",
              courseId: course.id,
              changes: { duration },
            });
        }}
      >
        <SelectTrigger
          id="builder-course-duration"
          className={`${propertyControlClassName} w-full`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </PropertyRow>
  );
}
