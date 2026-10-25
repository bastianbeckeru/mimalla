"use client";

import { Ellipsis, Plus, Trash2 } from "lucide-react";
import type { CSSProperties } from "react";
import type { Action } from "@/builder/apply";
import type { Curriculum, Period } from "@/builder/draft";
import {
  canRemovePeriod,
  getAvailableIntensiveTerms,
  getPeriodLabel,
} from "@/builder/periods";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
    <div className="flex items-start gap-1" style={style}>
      <h2 className="flex-1 text-balance text-center font-medium text-muted-foreground text-xs">
        {label}
      </h2>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Opciones de ${label}`}
            />
          }
        >
          <Ellipsis />
        </PopoverTrigger>
        <PopoverContent className="w-auto gap-1 p-1" align="end">
          {intensiveTerms.map((term) => (
            <Button
              key={term}
              variant="ghost"
              className="justify-start"
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
            </Button>
          ))}
          <Button
            variant="destructive"
            className="justify-start"
            disabled={!isRemovable}
            onClick={() => dispatch({ type: "removePeriod", period })}
          >
            <Trash2 /> Eliminar columna
          </Button>
          {!isRemovable && (
            <p className="max-w-56 px-2 pb-1 text-muted-foreground text-xs">
              Solo se pueden eliminar columnas sin cursos.
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
