"use client";

import { Plus, X } from "lucide-react";
import { getPeriodLabel } from "@/builder/periods";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { Action, Course, TermSystem } from "@/types/builder";

export default function ElectiveSlots({
  course,
  termSystem,
  dispatch,
}: {
  course: Course;
  termSystem: TermSystem;
  dispatch: (action: Action) => void;
}) {
  const hasSeveralSlots = course.slots.length > 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id="builder-course-elective"
          checked={course.isElective}
          onCheckedChange={(isElective) =>
            dispatch({
              type: "editCourse",
              courseId: course.id,
              changes: { isElective },
            })
          }
        />
        <Label htmlFor="builder-course-elective">Electivo</Label>
      </div>
      {course.isElective && (
        <>
          <p className="text-muted-foreground text-xs">
            Un electivo puede ubicarse en varias posiciones de la malla.
          </p>
          <ul className="flex flex-col gap-1">
            {course.slots.map((slot, slotIndex) => (
              <li
                key={`${slot.programYear}-${slot.term}-${slot.position}`}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span>
                  {getPeriodLabel(termSystem, slot)} · Fila {slot.position}
                </span>
                {hasSeveralSlots && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Quitar ubicación"
                    onClick={() =>
                      dispatch({
                        type: "removeSlot",
                        courseId: course.id,
                        slotIndex,
                      })
                    }
                  >
                    <X />
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            size="sm"
            onClick={() => dispatch({ type: "addSlot", courseId: course.id })}
          >
            <Plus />
            Agregar ubicación
          </Button>
          {hasSeveralSlots && (
            <p className="text-muted-foreground text-xs">
              Si deja de ser electivo, se conserva solo su primera ubicación.
            </p>
          )}
        </>
      )}
    </div>
  );
}
