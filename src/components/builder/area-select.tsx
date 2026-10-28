"use client";

import { Palette } from "lucide-react";
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
import type { Action, Area, Course } from "@/types/builder";

const NO_AREA_LABEL = "Sin área";

function AreaDot({ color }: { color?: string }) {
  return (
    <span
      className="size-2.5 shrink-0 rounded-[3px] bg-muted ring-1 ring-foreground/15"
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}

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
  const selectedArea = areas.find((area) => area.id === course.areaId);

  return (
    <PropertyRow icon={Palette} label="Área" htmlFor="builder-course-area">
      <Select
        items={items}
        value={course.areaId}
        onValueChange={(areaId: number | null) =>
          dispatch({ type: "assignArea", courseId: course.id, areaId })
        }
      >
        <SelectTrigger
          id="builder-course-area"
          className={`${propertyControlClassName} w-full`}
        >
          <SelectValue placeholder={NO_AREA_LABEL}>
            <AreaDot color={selectedArea?.color} />
            <span className="truncate">
              {selectedArea?.name ?? NO_AREA_LABEL}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={null}>
            <AreaDot />
            {NO_AREA_LABEL}
          </SelectItem>
          {areas.map((area) => (
            <SelectItem key={area.id} value={area.id}>
              <AreaDot color={area.color} />
              {area.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </PropertyRow>
  );
}
