"use client";

import { cn } from "cn";
import { Check, Lock, X } from "lucide-react";
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
import type { EnrollmentStatus } from "@/types/trajectory";

export type ClosingEnrollment = {
  id: string;
  name: string;
  grade: string | null;
  isAvailable: boolean;
  suggestedStatus: EnrollmentStatus | null;
};

export default function ClosePeriodDialog({
  open,
  periodLabel,
  enrollments,
  onOpenChange,
  onClose,
}: {
  open: boolean;
  periodLabel: string;
  enrollments: ClosingEnrollment[];
  onOpenChange: (open: boolean) => void;
  onClose: (statuses: Map<string, EnrollmentStatus>) => void;
}) {
  return (
    <AdaptiveDialog open={open} onOpenChange={onOpenChange}>
      <AdaptiveDialogContent className="sm:max-w-md">
        <AdaptiveDialogHeader>
          <AdaptiveDialogTitle>Cerrar periodo</AdaptiveDialogTitle>
          <AdaptiveDialogDescription>{periodLabel}</AdaptiveDialogDescription>
        </AdaptiveDialogHeader>
        <ClosePeriodForm enrollments={enrollments} onClose={onClose} />
      </AdaptiveDialogContent>
    </AdaptiveDialog>
  );
}

function ClosePeriodForm({
  enrollments,
  onClose,
}: {
  enrollments: ClosingEnrollment[];
  onClose: (statuses: Map<string, EnrollmentStatus>) => void;
}) {
  const [statuses, setStatuses] = useState(
    () =>
      new Map(
        enrollments.flatMap(({ id, isAvailable, suggestedStatus }) =>
          isAvailable && suggestedStatus
            ? [[id, suggestedStatus] as const]
            : [],
        ),
      ),
  );

  const unmarkedIds = enrollments
    .filter(({ id, isAvailable }) => isAvailable && !statuses.has(id))
    .map(({ id }) => id);

  function setStatus(id: string, status: EnrollmentStatus | undefined) {
    setStatuses((current) => {
      const next = new Map(current);
      if (status) next.set(id, status);
      else next.delete(id);
      return next;
    });
  }

  function approveUnmarked() {
    setStatuses(
      (current) =>
        new Map([
          ...current,
          ...unmarkedIds.map((id) => [id, "APPROVED"] as const),
        ]),
    );
  }

  return (
    <>
      <AdaptiveDialogBody className="sm:max-h-[60vh] sm:overflow-y-auto">
        <ul className="flex flex-col divide-y">
          {enrollments.map(({ id, name, grade, isAvailable }) => (
            <li key={id} className="flex min-h-13 items-center gap-3 py-1.5">
              <span
                className={cn(
                  "line-clamp-2 min-w-0 flex-1 text-sm",
                  isAvailable ? "font-medium" : "text-muted-foreground",
                )}
              >
                {name}
              </span>
              {grade && (
                <span className="shrink-0 text-muted-foreground text-sm tabular-nums">
                  {grade}
                </span>
              )}
              {isAvailable ? (
                <ToggleGroup
                  aria-label={`Estado de ${name}`}
                  spacing={1}
                  value={[statuses.get(id) ?? "PENDING"]}
                  className="shrink-0"
                  onValueChange={([value]) =>
                    setStatus(
                      id,
                      value === "APPROVED" || value === "FAILED"
                        ? value
                        : undefined,
                    )
                  }
                >
                  <ToggleGroupItem
                    value="FAILED"
                    aria-label="Reprobado"
                    className="size-10 min-w-0 px-0 text-muted-foreground aria-pressed:bg-destructive/10 aria-pressed:text-destructive sm:size-8"
                  >
                    <X />
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="APPROVED"
                    aria-label="Aprobado"
                    className="size-10 min-w-0 px-0 text-muted-foreground aria-pressed:bg-success/10 aria-pressed:text-success sm:size-8"
                  >
                    <Check />
                  </ToggleGroupItem>
                </ToggleGroup>
              ) : (
                <span className="flex shrink-0 items-center gap-1 text-muted-foreground text-xs">
                  <Lock className="size-3" />
                  Bloqueado
                </span>
              )}
            </li>
          ))}
        </ul>
      </AdaptiveDialogBody>
      <AdaptiveDialogFooter>
        {unmarkedIds.length > 0 && (
          <Button variant="ghost" onClick={approveUnmarked}>
            {statuses.size === 0 ? "Aprobar todos" : "Aprobar el resto"}
          </Button>
        )}
        <Button
          disabled={statuses.size === 0}
          onClick={() => onClose(statuses)}
        >
          Guardar
        </Button>
      </AdaptiveDialogFooter>
    </>
  );
}
