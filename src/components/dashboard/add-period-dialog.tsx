"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PeriodWithEnrollments } from "@/types/curriculum";
import { parsePeriodKey, TERM_LABELS } from "@/utils/period-key";

type AddPeriodDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (year: number, term: number) => void;
  periods: PeriodWithEnrollments[];
};

const terms = Object.entries(TERM_LABELS).map(([value, label]) => ({
  value: Number(value),
  label,
}));

export default function AddPeriodDialog({
  open,
  onOpenChange,
  onAdd,
  periods,
}: AddPeriodDialogProps) {
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);

  const years = [...new Set(periods.map((p) => parsePeriodKey(p.id).year))];
  const lastYear = years.at(-1);
  const yearOptions = (lastYear ? [...years, lastYear + 1] : years).map(
    (year) => ({ value: year, label: String(year) }),
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        setSelectedYear(null);
        setSelectedTerm(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir Periodo</DialogTitle>
        </DialogHeader>
        <div className="flex flex-row space-x-2 py-2">
          <Select
            items={yearOptions}
            onValueChange={(value: number | null) => {
              setSelectedTerm(null);
              setSelectedYear(value);
            }}
            value={selectedYear}
          >
            <SelectTrigger id="year" className="w-32">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((year) => (
                <SelectItem key={year.value} value={year.value}>
                  {year.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={terms}
            onValueChange={(value: number | null) => setSelectedTerm(value)}
            value={selectedTerm}
            disabled={!selectedYear}
          >
            <SelectTrigger id="term">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem
                  key={term.value}
                  value={term.value}
                  disabled={periods.some(
                    (p) => p.id === `${selectedYear}-${term.value}`,
                  )}
                >
                  {term.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="ghost" />}>
            Cancelar
          </DialogClose>
          <DialogClose
            render={
              <Button
                disabled={!selectedYear || !selectedTerm}
                onClick={() => {
                  if (!selectedYear || !selectedTerm) return;

                  onAdd(selectedYear, selectedTerm);
                }}
              />
            }
          >
            Añadir
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
