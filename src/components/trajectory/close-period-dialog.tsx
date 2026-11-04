"use client";

import { Lock } from "lucide-react";
import { useState } from "react";
import StatusControl from "@/components/trajectory/status-control";
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
        <ClosePeriodForm
          enrollments={enrollments}
          onCancel={() => onOpenChange(false)}
          onClose={onClose}
        />
      </AdaptiveDialogContent>
    </AdaptiveDialog>
  );
}

function ClosePeriodForm({
  enrollments,
  onCancel,
  onClose,
}: {
  enrollments: ClosingEnrollment[];
  onCancel: () => void;
  onClose: (statuses: Map<string, EnrollmentStatus>) => void;
}) {
  const [statuses, setStatuses] = useState(
    () =>
      new Map(
        enrollments.flatMap(({ id, suggestedStatus }) =>
          suggestedStatus ? [[id, suggestedStatus] as const] : [],
        ),
      ),
  );

  return (
    <>
      <AdaptiveDialogBody className="space-y-4 sm:max-h-[60vh] sm:overflow-y-auto">
        {enrollments.map(({ id, name, grade, isAvailable }) => (
          <div key={id} className="space-y-1.5 text-sm">
            <p className="flex items-baseline justify-between gap-3 font-medium">
              <span className="min-w-0 truncate">{name}</span>
              {grade && <span className="shrink-0 tabular-nums">{grade}</span>}
            </p>
            {isAvailable ? (
              <StatusControl
                status={statuses.get(id) ?? "PENDING"}
                isAvailable
                onChange={(status) =>
                  setStatuses((current) => new Map(current).set(id, status))
                }
              />
            ) : (
              <p className="flex h-9 items-center gap-1.5 rounded-lg bg-muted px-2.5 text-muted-foreground text-xs">
                <Lock className="size-3" />
                Bloqueado
              </p>
            )}
          </div>
        ))}
      </AdaptiveDialogBody>
      <AdaptiveDialogFooter>
        <Button variant="ghost" onClick={onCancel}>
          Cancelar
        </Button>
        <Button onClick={() => onClose(statuses)}>Guardar</Button>
      </AdaptiveDialogFooter>
    </>
  );
}
