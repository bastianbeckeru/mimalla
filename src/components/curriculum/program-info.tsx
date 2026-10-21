import type { ReactNode } from "react";
import InfoItem from "@/components/curriculum/info-item";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type {
  CredentialType,
  Institution,
  Plan,
  Program,
} from "@/types/curriculum";

const CredentialTypeLabels: Record<CredentialType, string> = {
  PROFESSIONAL: "Título Profesional",
  ACADEMIC: "Grado Académico",
  TECHNICAL: "Título Técnico",
  CERTIFICATE: "Certificado",
};

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
  const { schedule, siesCode, demreCode } = program;

  const credentials = plans
    .map((p) => p.credential)
    .filter((c) => c !== null)
    .sort((a, b) => {
      const order = {
        PROFESSIONAL: 0,
        ACADEMIC: 1,
        TECHNICAL: 2,
        CERTIFICATE: 3,
      };
      return order[a.type] - order[b.type];
    });

  return (
    <Card className="max-h-full w-full rounded-none border-0 bg-card text-foreground lg:max-w-96">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="font-bold text-2xl leading-tight">
          {program.name}
        </CardTitle>
        <span className="font-normal text-muted-foreground text-sm">
          {institution.name}
        </span>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <dl className="space-y-4">
          {credentials.map((c) => (
            <InfoItem
              key={`${c.type}-${c.name}`}
              label={CredentialTypeLabels[c.type]}
              value={c.name}
            />
          ))}

          {credentials.length > 0 && <Separator />}

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
