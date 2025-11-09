import type { ReactNode } from "react";
import type { Institution, Program, Plan } from "@/types/curriculum";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import InfoItem from "@/components/curriculum/info-item";

export default function ProgramInfo({
  institution,
  program,
  plans,
  duration,
  children,
}: {
  institution: Institution;
  program: Program;
  plans: Plan[];
  duration: number;
  children?: ReactNode;
}) {
  const professionalCredential = plans.find(
    (p) => p.credential?.type === "PROFESSIONAL",
  );
  const academicCredential = plans.find(
    (p) => p.credential?.type === "ACADEMIC",
  );
  const { schedule, siesCode, demreCode } = program;

  return (
    <Card className="bg-card text-foreground max-h-full w-full rounded-none border-0 lg:max-w-96">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-2xl leading-tight font-bold">
          {program.name}
        </CardTitle>
        <span className="text-muted-foreground text-sm font-normal">
          {institution.name}
        </span>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <dl className="space-y-4">
          {professionalCredential && (
            <InfoItem
              label="Título Profesional"
              value={professionalCredential.name}
            />
          )}
          {academicCredential && (
            <InfoItem label="Grado Académico" value={academicCredential.name} />
          )}

          {(professionalCredential || academicCredential) && <Separator />}

          <div className="grid grid-cols-2 gap-8">
            <InfoItem
              label="Jornada"
              value={schedule === "DAYTIME" ? "Diurna" : "Vespertina"}
            />
            <InfoItem
              label="Duración"
              value={`${duration} semestres`}
              type="time"
            />
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-8">
            <InfoItem label="Código SIES" value={siesCode} type="code" />
            <InfoItem label="Código DEMRE" value={demreCode} type="code" />
          </div>
        </dl>
      </CardContent>

      <CardFooter className="grid flex-shrink-0 grid-cols-1 gap-2">
        {children}
      </CardFooter>
    </Card>
  );
}
