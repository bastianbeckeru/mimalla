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
import type { Course, PeriodKey } from "@/types/curriculum";
import { parsePeriodKey, TERM_LABELS } from "@/utils/period-key";

type AddEnrollmentDialogProps = {
  periodId: PeriodKey | null;
  onOpenChange: (open: boolean) => void;
  courses: Course[];
  onAdd: (periodId: PeriodKey, courseId: number) => void;
};

export default function AddEnrollmentDialog({
  periodId,
  onOpenChange,
  courses,
  onAdd,
}: AddEnrollmentDialogProps) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const period = periodId && parsePeriodKey(periodId);
  const courseOptions = courses.map((c) => ({ value: c.id, label: c.name }));

  return (
    <Dialog
      open={periodId !== null}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        setSelectedCourseId(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Añadir inscripción</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pb-4">
          {period && (
            <dl>
              <div className="flex flex-row gap-2">
                <dt className="font-medium text-muted-foreground">Año:</dt>
                <dd className="flex-1 text-foreground">{period.year}</dd>
              </div>
              <div className="flex flex-row gap-2">
                <dt className="font-medium text-muted-foreground">Periodo:</dt>
                <dd className="flex-1 text-foreground">
                  {TERM_LABELS[period.term]}
                </dd>
              </div>
            </dl>
          )}

          <div className="flex flex-row items-center gap-2">
            <h3 className="font-medium text-muted-foreground">Curso:</h3>
            <Select
              items={courseOptions}
              value={selectedCourseId}
              onValueChange={(value: number | null) =>
                setSelectedCourseId(value)
              }
            >
              <SelectTrigger id="courseId" className="w-96">
                <SelectValue placeholder="Selecciona un curso" />
              </SelectTrigger>
              <SelectContent className="w-96">
                {courseOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="ghost" />}>
            Cancelar
          </DialogClose>
          <DialogClose
            render={
              <Button
                disabled={!selectedCourseId}
                onClick={() => {
                  if (!periodId || !selectedCourseId) return;

                  onAdd(periodId, selectedCourseId);
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
