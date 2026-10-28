"use client";

import { Ellipsis, Plus, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import {
  canRemovePeriod,
  getAvailableIntensiveTerms,
  getPeriodLabel,
} from "@/builder/periods";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Action, Curriculum, Period } from "@/types/builder";
import { TERM_LABELS } from "@/utils/period-key";

export default function PeriodHeader({
  curriculum,
  period,
  dispatch,
  style,
}: {
  curriculum: Curriculum;
  period: Period;
  dispatch: (action: Action) => void;
  style: CSSProperties;
}) {
  const label = getPeriodLabel(curriculum.termSystem, period);
  const intensiveTerms = getAvailableIntensiveTerms(
    curriculum,
    period.programYear,
  );
  const isRemovable = canRemovePeriod(curriculum, period);

  return (
    <h2 style={style}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Opciones de ${label}`}
          className="group/header flex w-full items-center gap-1 rounded-md px-2 py-1 text-left font-semibold text-muted-foreground text-xs outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted data-popup-open:text-foreground"
        >
          <span className="flex-1 truncate">{label}</span>
          <Ellipsis className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover/header:opacity-100 group-focus-visible/header:opacity-100 group-data-popup-open/header:opacity-100" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto">
          {intensiveTerms.map((term) => (
            <DropdownMenuItem
              key={term}
              onClick={() =>
                dispatch({
                  type: "addIntensiveTerm",
                  programYear: period.programYear,
                  term,
                })
              }
            >
              <Plus /> Agregar {TERM_LABELS[term]?.toLowerCase()} al año{" "}
              {period.programYear}
            </DropdownMenuItem>
          ))}
          {intensiveTerms.length > 0 && <DropdownMenuSeparator />}
          <DropdownMenuItem
            variant="destructive"
            disabled={!isRemovable}
            onClick={() => dispatch({ type: "removePeriod", period })}
          >
            <Trash2 /> Eliminar columna
          </DropdownMenuItem>
          {!isRemovable && (
            <p className="max-w-56 px-1.5 py-1 text-muted-foreground text-xs">
              Solo se pueden eliminar columnas sin cursos.
            </p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </h2>
  );
}
