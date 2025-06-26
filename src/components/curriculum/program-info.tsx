import type { CurriculumData } from "@/types/curriculum";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";

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
    <Card className="bg-sidebar text-foreground max-h-full max-w-96 min-w-64 rounded-none border-0">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="text-2xl leading-tight font-bold">
          {program.name}
        </CardTitle>
        <span className="text-muted-foreground mt-1 block text-base font-normal">
          {institution.name}
        </span>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          <InfoItem
            label="Título Profesional"
            value={professionalTitle?.name}
          />
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
        </div>
      </CardContent>

      <CardFooter className="flex-shrink-0">{children}</CardFooter>
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
      <h3 className="text-muted-foreground text-sm">
        {label}
        {": "}
      </h3>
      <span className="text-foreground">{value}</span>
    </div>
  );
