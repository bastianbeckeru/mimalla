"use client";

import {
  AdaptiveDialog,
  AdaptiveDialogBody,
  AdaptiveDialogContent,
  AdaptiveDialogDescription,
  AdaptiveDialogFooter,
  AdaptiveDialogHeader,
  AdaptiveDialogTitle,
} from "@/components/ui/adaptive-dialog";
import { Button } from "@/components/ui/button";
import type { PeriodKey } from "@/types/curriculum";

export default function PassedPeriodsDialog({
  open,
  options,
  onOpenChange,
  onChoose,
}: {
  open: boolean;
  options: { period: PeriodKey; label: string }[];
  onOpenChange: (open: boolean) => void;
  onChoose: (period: PeriodKey) => void;
}) {
  return (
    <AdaptiveDialog open={open} onOpenChange={onOpenChange}>
      <AdaptiveDialogContent className="sm:max-w-md">
        <AdaptiveDialogHeader>
          <AdaptiveDialogTitle>
            ¿Hasta qué periodo aprobaste todo?
          </AdaptiveDialogTitle>
          <AdaptiveDialogDescription>
            Marcaremos esos cursos como aprobados. Después puedes corregir las
            excepciones.
          </AdaptiveDialogDescription>
        </AdaptiveDialogHeader>
        <AdaptiveDialogBody className="sm:max-h-[50vh] sm:overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            {options.toReversed().map(({ period, label }) => (
              <Button
                key={period}
                variant="outline"
                className="min-h-11 justify-start"
                onClick={() => onChoose(period)}
              >
                {label}
              </Button>
            ))}
          </div>
        </AdaptiveDialogBody>
        <AdaptiveDialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Marcarlos uno a uno
          </Button>
        </AdaptiveDialogFooter>
      </AdaptiveDialogContent>
    </AdaptiveDialog>
  );
}
