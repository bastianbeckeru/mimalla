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
  plans,
  duration,
  children,
}: {
  institution: CurriculumData["institution"];
  program: CurriculumData["program"];
  plans: CurriculumData["curriculum"]["plans"];
  duration: number;
  children?: React.ReactNode;
}) {
  const professionalTitle = plans.find((p) => p.type === "PROFESSIONAL");
  const academicTitle = plans.find((p) => p.type === "ACADEMIC");
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
      <h3 className="text-muted-foreground text-sm font-medium">
        {label}
        {": "}
      </h3>
      <span className="text-foreground text-base font-normal">{value}</span>
    </div>
  );
