import type { CurriculumData } from "@/types/curriculum";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export default function ProgramInfo({
  institution,
  program,
  degrees,
  duration,
  children,
}: {
  institution: CurriculumData["institution"];
  program: CurriculumData["program"];
  degrees: CurriculumData["degrees"];
  duration: number;
  children?: React.ReactNode;
}) {
  const professionalTitle = degrees.find((d) => d.type === "PROFESSIONAL");
  const academicTitle = degrees.find((d) => d.type === "ACADEMIC");
  const { schedule, siesCode, demreCode } = program;

  return (
    <Card className="rounded-none bg-sidebar text-foreground lg:w-[26rem] lg:rounded-r-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold leading-tight">
          {program.name}
        </CardTitle>
        <span className="mt-1 block text-base font-normal text-zinc-400">
          {institution.name}
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <InfoItem label="Título Profesional" value={professionalTitle?.name} />
        <InfoItem label="Grado Académico" value={academicTitle?.name} />

        <InfoItem label="Duración" value={`${duration} semestres`} />
        <InfoItem
          label="Jornada"
          value={schedule === "DAYTIME" ? "Diurna" : "Vespertina"}
        />

        <div className="flex flex-col justify-between space-y-2 border-t py-2">
          <InfoItem label="Código SIES" value={siesCode} />
          <InfoItem label="Código DEMRE" value={demreCode} />
        </div>

        {children}
      </CardContent>
    </Card>
  );
}

const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) =>
  value && (
    <div>
      <h3 className="text-sm text-muted-foreground">
        {label}
        {": "}
      </h3>
      <span className="text-foreground">{value}</span>
    </div>
  );
