"use client";

import type { EnrollmentProps } from "@/types/user";

import Grade from "./Grade";
import GradeForm from "./GradeForm";
import Subgrade from "./Subgrade";
import { gradeAverage } from "@/utils/curriculumFunctions";

import {
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

type Props = {
  enrollment: EnrollmentProps;
};

export default function CourseModal({ enrollment }: Props) {
  const average = gradeAverage(enrollment.grades);

  return (
    <DialogContent tabIndex={-1} className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{enrollment.course?.name ?? `Curso`}</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        Código: {enrollment.course?.code ?? "XYZ0000"}
        {" | "}
        {enrollment.course?.credits ?? "0"} Créditos
      </DialogDescription>
      <div className="flex size-full min-h-48 flex-col justify-between">
        <div className="flex w-full flex-col space-y-1 rounded-md px-16 py-2">
          {enrollment.grades.length > 0 ? (
            enrollment.grades.map((grade, gIndex) => {
              return (
                <Grade key={gIndex} enrollmentId={enrollment.id} grade={grade}>
                  {grade.subgrades?.map((subgrade) => {
                    return (
                      <Subgrade
                        key={subgrade.id.toString()}
                        enrollmentId={enrollment.id}
                        gradeId={grade.id}
                        subgrade={subgrade}
                      />
                    );
                  })}
                </Grade>
              );
            })
          ) : (
            <p className="text-center text-muted-foreground">
              No hay notas disponibles
            </p>
          )}
        </div>
        <GradeForm enrollmentId={enrollment.id} grades={enrollment.grades} />
      </div>
      <DialogFooter>
        <p>
          Promedio:{" "}
          {average !== 0 ? average.toFixed(1).replace(".", ",") : "😴"}
        </p>
      </DialogFooter>
    </DialogContent>
  );
}
