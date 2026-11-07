"use client";

import { cn } from "cn";
import { STATUS_LABELS } from "@/components/trajectory/enrollment-card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { EnrollmentStatus } from "@/types/trajectory";

const STATUS_ORDER: EnrollmentStatus[] = ["FAILED", "PENDING", "APPROVED"];

const SELECTED_TEXT: Record<EnrollmentStatus, string> = {
  FAILED: "aria-pressed:text-destructive",
  PENDING: "aria-pressed:text-foreground",
  APPROVED: "aria-pressed:text-success",
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
      className="w-full min-w-56 flex-1"
      onValueChange={([value]) => {
        const next = STATUS_ORDER.find((option) => option === value);
        if (next) onChange(next);
      }}
    >
      {STATUS_ORDER.map((option) => (
        <ToggleGroupItem
          key={option}
          value={option}
          disabled={option === "APPROVED" && !isAvailable}
          className={cn(
            "h-9 min-w-0 flex-1 text-muted-foreground capitalize",
            SELECTED_TEXT[option],
          )}
        >
          {STATUS_LABELS[option]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
