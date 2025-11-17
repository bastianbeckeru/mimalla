"use client";

import type { PeriodWithEnrollments } from "@/types/curriculum";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useState } from "react";
import { useNewCurriculumStore } from "@/stores/newCurriculum";

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
    ...new Set(periods.map((period) => period.id.split("-")[0]!)),
  ].map(Number);

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
            onValueChange={(value) => {
              setSelectedTerm(null);
              setSelectedYear(Number(value));
            }}
            value={selectedYear ? String(selectedYear) : ""}
          >
            <SelectTrigger id="year" className="w-32">
              <SelectValue placeholder="Año" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year + enrolledYear - 1}
                </SelectItem>
              ))}
              <SelectItem value={String(years.length + 1)}>
                {years.length + enrolledYear}
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            onValueChange={(value) => setSelectedTerm(Number(value))}
            value={selectedTerm ? String(selectedTerm) : ""}
            disabled={!selectedYear}
          >
            <SelectTrigger id="term">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              {terms.map((term) => (
                <SelectItem
                  key={term.value}
                  value={String(term.value)}
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
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={() => {
                if (!selectedYear || !selectedTerm) return;

                handleAddPeriod(selectedYear, selectedTerm);
              }}
            >
              Añadir
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
