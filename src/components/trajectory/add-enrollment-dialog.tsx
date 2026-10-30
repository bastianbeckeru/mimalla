"use client";

import { useState } from "react";
import {
  AdaptiveDialog,
  AdaptiveDialogBody,
  AdaptiveDialogClose,
  AdaptiveDialogContent,
  AdaptiveDialogDescription,
  AdaptiveDialogFooter,
  AdaptiveDialogHeader,
  AdaptiveDialogTitle,
} from "@/components/ui/adaptive-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Course } from "@/types/builder";
import type { Placement } from "@/types/trajectory";

export default function AddEnrollmentDialog({
  placement,
  periodLabel,
  courses,
  onOpenChange,
  onAdd,
}: {
  placement: Placement | null;
  periodLabel: string;
  courses: Course[];
  onOpenChange: (open: boolean) => void;
  onAdd: (placement: Placement, course: Course) => void;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const courseOptions = courses.map((c) => ({ value: c.id, label: c.name }));
  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <AdaptiveDialog
      open={placement !== null}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen);
        setSelectedCourseId(null);
      }}
    >
      <AdaptiveDialogContent className="sm:max-w-md">
        <AdaptiveDialogHeader>
          <AdaptiveDialogTitle>Agregar curso</AdaptiveDialogTitle>
          <AdaptiveDialogDescription>{periodLabel}</AdaptiveDialogDescription>
        </AdaptiveDialogHeader>
        <AdaptiveDialogBody>
          <Select
            items={courseOptions}
            value={selectedCourseId}
            onValueChange={(value: number | null) => setSelectedCourseId(value)}
          >
            <SelectTrigger aria-label="Curso" className="w-full">
              <SelectValue placeholder="Selecciona un curso" />
            </SelectTrigger>
            <SelectContent>
              {courseOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </AdaptiveDialogBody>
        <AdaptiveDialogFooter>
          <AdaptiveDialogClose render={<Button variant="ghost" />}>
            Cancelar
          </AdaptiveDialogClose>
          <AdaptiveDialogClose
            render={
              <Button
                disabled={!selectedCourse}
                onClick={() => {
                  if (placement && selectedCourse)
                    onAdd(placement, selectedCourse);
                }}
              />
            }
          >
            Agregar
          </AdaptiveDialogClose>
        </AdaptiveDialogFooter>
      </AdaptiveDialogContent>
    </AdaptiveDialog>
  );
}
