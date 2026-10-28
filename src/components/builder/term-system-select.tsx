"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TermSystem } from "@/types/builder";

const TERM_SYSTEMS: { value: TermSystem; label: string }[] = [
  { value: "semester", label: "Semestral" },
  { value: "annual", label: "Anual" },
];

export default function TermSystemSelect({
  id,
  value,
  onChange,
  disabled,
  className = "w-32",
}: {
  id: string;
  className?: string;
  value: TermSystem;
  onChange: (termSystem: TermSystem) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      items={TERM_SYSTEMS}
      value={value}
      onValueChange={(termSystem) => termSystem && onChange(termSystem)}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {TERM_SYSTEMS.map((termSystem) => (
            <SelectItem key={termSystem.value} value={termSystem.value}>
              {termSystem.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
