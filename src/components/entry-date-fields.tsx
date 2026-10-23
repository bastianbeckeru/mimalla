"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ENTRY_TERMS } from "@/utils/period-key";

const FIRST_ENTRY_YEAR = 2020;
const entryYears = Array.from(
  { length: new Date().getFullYear() - FIRST_ENTRY_YEAR + 1 },
  (_, index) => FIRST_ENTRY_YEAR + index,
);

type EntryDateFieldsProps = {
  year: number | null;
  term: number | null;
  onYearChange: (year: number | null) => void;
  onTermChange: (term: number | null) => void;
  disabled?: boolean;
};

export function EntryDateFields({
  year,
  term,
  onYearChange,
  onTermChange,
  disabled,
}: EntryDateFieldsProps) {
  return (
    <div className="flex flex-row gap-2">
      <Select value={year} onValueChange={onYearChange} disabled={disabled}>
        <SelectTrigger id="entry-year" className="min-w-24">
          <SelectValue placeholder="Año" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {entryYears.map((entryYear) => (
              <SelectItem key={entryYear} value={entryYear}>
                {entryYear}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select
        items={ENTRY_TERMS}
        value={term}
        onValueChange={onTermChange}
        disabled={disabled}
      >
        <SelectTrigger id="entry-term" className="flex-1">
          <SelectValue placeholder="Semestre" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {ENTRY_TERMS.map((entryTerm) => (
              <SelectItem key={entryTerm.value} value={entryTerm.value}>
                {entryTerm.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
