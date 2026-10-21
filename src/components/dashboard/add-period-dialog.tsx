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
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import type { PeriodWithEnrollments } from "@/types/curriculum";
import { parsePeriodKey } from "@/utils/period-key";

type AddPeriodDialogProps = {
  open: boolean;
  onOpenChange: () => void;
  handleAddPeriod: (year: number, term: number) => void;
  periods: PeriodWithEnrollments[];
};

const terms = [
  { value: 1, label: "Primer Semestre" },
  { value: 2, label: "Invierno" },
  { value: 3, label: "Segundo Semestre" },
  { value: 4, label: "Verano" },
];

export default function AddPeriodDialog({
  open,
  onOpenChange,
  handleAddPeriod,
  periods,
}: AddPeriodDialogProps) {
  const { curriculums, activeCurriculumId } = useNewCurriculumStore();
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<number | null>(null);

  const enrolledYear =
    curriculums.find((c) => c.id === activeCurriculumId)?.year ?? 2020;

  const years = [
    ...new Set(periods.map((period) => parsePeriodKey(period.id).year)),
  ];
  const yearOptions = [...years, years.length + 1].map((year) => ({
    value: year,
    label: year + enrolledYear - 1,
  }));

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        onOpenChange();
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
                onClick={() => {
                  if (!selectedYear || !selectedTerm) return;

                  handleAddPeriod(selectedYear, selectedTerm);
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
