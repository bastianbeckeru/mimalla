import type { CurriculumData } from "@/types/curriculum";
import { Card, CardContent } from "../ui/card";

export default function ProgramInfo({
  program,
  degrees,
  duration,
}: {
  program: CurriculumData["program"];
  degrees: CurriculumData["degrees"];
  duration: number;
}) {
  const professionalTitle = degrees.find((d) => d.type === "PROFESSIONAL");
  const academicTitle = degrees.find((d) => d.type === "ACADEMIC");
  const { schedule, siesCode, demreCode } = program;

  return (
    <Card className="w-1/4 space-y-2 rounded-sm bg-neutral-800 p-2 text-foreground">
      <CardContent className="space-y-2">
        <InfoItem label="Título Profesional" value={professionalTitle?.name} />
        <InfoItem label="Grado Académico" value={academicTitle?.name} />
        <InfoItem label="Duración" value={`${duration} semestres`} />
        <InfoItem
          label="Jornada"
          value={schedule === "DAYTIME" ? "Diurna" : "Vespertina"}
        />
        <InfoItem label="Código SIES" value={siesCode} />
        <InfoItem label="Código DEMRE" value={demreCode} />
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
    <p className="text-sm">
      <span className="font-semibold">{label}:</span>{" "}
      <span className="font-normal">{value}</span>
    </p>
  );
