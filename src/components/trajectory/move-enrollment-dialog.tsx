"use client";

import { cn } from "cn";
import {
  AdaptiveDialog,
  AdaptiveDialogBody,
  AdaptiveDialogContent,
  AdaptiveDialogDescription,
  AdaptiveDialogHeader,
  AdaptiveDialogTitle,
} from "@/components/ui/adaptive-dialog";
import type { PeriodKey } from "@/types/curriculum";

export type MoveOption = {
  period: PeriodKey;
  label: string;
  isCurrent: boolean;
  conflict: string | null;
};

export default function MoveEnrollmentDialog({
  open,
  courseName,
  options,
  onOpenChange,
  onMove,
}: {
  open: boolean;
  courseName: string;
  options: MoveOption[];
  onOpenChange: (open: boolean) => void;
  onMove: (period: PeriodKey) => void;
}) {
  return (
    <AdaptiveDialog open={open} onOpenChange={onOpenChange}>
      <AdaptiveDialogContent className="sm:max-w-md">
        <AdaptiveDialogHeader>
          <AdaptiveDialogTitle>Mover a…</AdaptiveDialogTitle>
          <AdaptiveDialogDescription>{courseName}</AdaptiveDialogDescription>
        </AdaptiveDialogHeader>
        <AdaptiveDialogBody className="pb-4 sm:max-h-[60vh] sm:overflow-y-auto">
          <ul className="-mx-2">
            {options.map(({ period, label, isCurrent, conflict }) => (
              <li key={period}>
                <button
                  type="button"
                  disabled={isCurrent || conflict !== null}
                  className={cn(
                    "flex min-h-11 w-full flex-col justify-center rounded-lg px-2 py-1.5 text-left text-sm hover:bg-muted disabled:pointer-events-none",
                    (isCurrent || conflict !== null) && "text-muted-foreground",
                  )}
                  onClick={() => onMove(period)}
                >
                  <span>
                    {label}
                    {isCurrent && " · Está aquí"}
                  </span>
                  {conflict && <span className="text-xs">{conflict}</span>}
                </button>
              </li>
            ))}
          </ul>
        </AdaptiveDialogBody>
      </AdaptiveDialogContent>
    </AdaptiveDialog>
  );
}
