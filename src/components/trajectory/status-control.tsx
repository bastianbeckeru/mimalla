"use client";

import { cn } from "cn";
import { STATUS_LABELS } from "@/components/trajectory/enrollment-card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EnrollmentStatus } from "@/types/trajectory";

const STATUS_ORDER: EnrollmentStatus[] = ["FAILED", "PENDING", "APPROVED"];

const STATUS_DOT: Partial<Record<EnrollmentStatus, string>> = {
  APPROVED: "bg-success",
  FAILED: "bg-destructive",
};

export default function StatusControl({
  status,
  isAvailable,
  onChange,
}: {
  status: EnrollmentStatus;
  isAvailable: boolean;
  onChange: (status: EnrollmentStatus) => void;
}) {
  return (
    <ToggleGroup
      aria-label="Estado"
      variant="outline"
      spacing={0}
      value={[status]}
      className="w-full"
      onValueChange={([value]) => {
        const next = STATUS_ORDER.find((option) => option === value);
        if (next) onChange(next);
      }}
    >
      {STATUS_ORDER.map((option) => {
        const dot = STATUS_DOT[option];
        return (
          <ToggleGroupItem
            key={option}
            value={option}
            disabled={option === "APPROVED" && !isAvailable}
            className="h-9 min-w-0 flex-1 capitalize"
          >
            {dot && (
              <span aria-hidden className={cn("size-1.75 rounded-full", dot)} />
            )}
            {STATUS_LABELS[option]}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
