"use client";

import { cn } from "cn";
import { useState } from "react";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { PeriodKey } from "@/types/curriculum";
import { parsePeriodKey } from "@/utils/period-key";

type PassedPeriodOption = { period: PeriodKey; label: string };

export default function PassedPeriodsDialog({
  open,
  options,
  getApprovedCount,
  onOpenChange,
  onApprove,
}: {
  open: boolean;
  options: PassedPeriodOption[];
  getApprovedCount: (period: PeriodKey) => number;
  onOpenChange: (open: boolean) => void;
  onApprove: (period: PeriodKey) => void;
}) {
  return (
    <AdaptiveDialog open={open} onOpenChange={onOpenChange}>
      <AdaptiveDialogContent className="sm:max-w-md">
        <AdaptiveDialogHeader>
          <AdaptiveDialogTitle>
            ¿Hasta qué semestre aprobaste todo?
          </AdaptiveDialogTitle>
          <AdaptiveDialogDescription>
            Si reprobaste algún curso, podrás corregirlo después en tu malla.
          </AdaptiveDialogDescription>
        </AdaptiveDialogHeader>
        <PassedPeriodsForm
          options={options}
          getApprovedCount={getApprovedCount}
          onDismiss={() => onOpenChange(false)}
          onApprove={onApprove}
        />
      </AdaptiveDialogContent>
    </AdaptiveDialog>
  );
}

function PassedPeriodsForm({
  options,
  getApprovedCount,
  onDismiss,
  onApprove,
}: {
  options: PassedPeriodOption[];
  getApprovedCount: (period: PeriodKey) => number;
  onDismiss: () => void;
  onApprove: (period: PeriodKey) => void;
}) {
  const [selected, setSelected] = useState(options.at(-1)?.period ?? null);
  const [approvedCounts] = useState(
    () =>
      new Map(
        options.map(
          ({ period }) => [period, getApprovedCount(period)] as const,
        ),
      ),
  );

  const selectedIndex = options.findIndex(({ period }) => period === selected);
  const approvedCount = selected ? (approvedCounts.get(selected) ?? 0) : 0;

  return (
    <>
      <AdaptiveDialogBody>
        <ToggleGroup
          aria-label="Último semestre aprobado"
          variant="outline"
          spacing={1.5}
          value={selected ? [selected] : []}
          className="grid w-full grid-cols-3 items-stretch"
          onValueChange={([value]) => {
            const option = options.find(({ period }) => period === value);
            if (option) setSelected(option.period);
          }}
        >
          {options.map(({ period, label }, index) => (
            <ToggleGroupItem
              key={period}
              value={period}
              className={cn(
                "h-auto min-h-14 flex-col gap-0 px-1 py-2 text-muted-foreground text-xs aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary aria-pressed:hover:text-primary-foreground",
                index < selectedIndex &&
                  "border-transparent bg-muted text-foreground",
              )}
            >
              {label}
              <span className="font-normal tabular-nums opacity-70">
                {parsePeriodKey(period).year}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </AdaptiveDialogBody>
      <AdaptiveDialogFooter>
        <Button variant="ghost" onClick={onDismiss}>
          Ahora no
        </Button>
        <Button
          disabled={!selected || approvedCount === 0}
          onClick={() => {
            if (selected) onApprove(selected);
          }}
        >
          {approvedCount === 1
            ? "Aprobar 1 curso"
            : `Aprobar ${approvedCount} cursos`}
        </Button>
      </AdaptiveDialogFooter>
    </>
  );
}
