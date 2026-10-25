"use client";

import { CalendarMinus, CalendarPlus } from "lucide-react";
import type { Action } from "@/builder/apply";
import type { Curriculum } from "@/builder/draft";
import { canRemoveLastProgramYear } from "@/builder/periods";
import { Button } from "@/components/ui/button";

export default function ProgramYearControls({
  curriculum,
  dispatch,
}: {
  curriculum: Curriculum;
  dispatch: (action: Action) => void;
}) {
  const isRemovable = canRemoveLastProgramYear(curriculum);

  return (
    <div className="flex shrink-0 flex-col gap-2">
      <Button
        variant="outline"
        onClick={() => dispatch({ type: "addProgramYear" })}
      >
        <CalendarPlus /> Agregar año
      </Button>
      <Button
        variant="outline"
        disabled={!isRemovable}
        title={
          isRemovable
            ? undefined
            : "Solo se puede quitar el último año si no tiene cursos"
        }
        onClick={() => dispatch({ type: "removeLastProgramYear" })}
      >
        <CalendarMinus /> Quitar último año
      </Button>
    </div>
  );
}
