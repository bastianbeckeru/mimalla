"use client";

import { Plus, Shuffle, X } from "lucide-react";
import { getPeriodTitle } from "@/builder/periods";
import PropertyRow from "@/components/builder/property-row";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
    <>
      <PropertyRow
        icon={Shuffle}
        label="Electivo"
        htmlFor="builder-course-elective"
      >
        <Switch
          id="builder-course-elective"
          className="ml-2"
          checked={course.isElective}
          onCheckedChange={(isElective) =>
            dispatch({
              type: "editCourse",
              courseId: course.id,
              changes: { isElective },
            })
          }
        />
      </PropertyRow>
      {course.isElective && (
        <div className="mt-1 ml-9 flex flex-col gap-2 border-l pl-3">
          <p className="text-muted-foreground text-xs">
            Un electivo puede ubicarse en varias posiciones de la malla.
          </p>
          <ul className="flex flex-col">
            {course.slots.map((slot, slotIndex) => (
              <li
                key={`${slot.programYear}-${slot.term}-${slot.position}`}
                className="flex h-7 items-center justify-between gap-2 text-sm"
              >
                <span>
                  {getPeriodTitle(termSystem, slot)}
                  <span className="text-muted-foreground">
                    {" · "}Fila {slot.position}
                  </span>
                </span>
                {hasSeveralSlots && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Quitar ubicación"
                    className="text-muted-foreground"
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
            variant="ghost"
            size="sm"
            className="-ml-2.5 self-start text-muted-foreground"
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
        </div>
      )}
    </>
  );
}
