"use client";

import type { Action } from "@/builder/apply";
import type { Area, Course } from "@/builder/draft";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_AREA_LABEL = "Sin área";

export default function AreaSelect({
  course,
  areas,
  dispatch,
}: {
  course: Course;
  areas: Area[];
  dispatch: (action: Action) => void;
}) {
  const items = [
    { value: null, label: NO_AREA_LABEL },
    ...areas.map((area) => ({ value: area.id, label: area.name })),
  ];

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="builder-course-area">Área</Label>
      <Select
        items={items}
        value={course.areaId}
        onValueChange={(areaId: number | null) =>
          dispatch({ type: "assignArea", courseId: course.id, areaId })
        }
      >
        <SelectTrigger id="builder-course-area" className="w-full">
          <SelectValue placeholder={NO_AREA_LABEL} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>{NO_AREA_LABEL}</SelectItem>
          {areas.map((area) => (
            <SelectItem key={area.id} value={area.id}>
              <span
                className="size-3 shrink-0 rounded-sm ring-1 ring-foreground/15"
                style={{ backgroundColor: area.color }}
              />
              {area.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
