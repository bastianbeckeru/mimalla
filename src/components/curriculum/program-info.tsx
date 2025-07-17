import type { CurriculumData } from "@/types/curriculum";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Separator } from "../ui/separator";

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
        <dl className="space-y-4">
          {professionalTitle && (
            <InfoItem
              label="Título Profesional"
              value={professionalTitle.name}
            />
          )}
          {academicTitle && (
            <InfoItem label="Grado Académico" value={academicTitle.name} />
          )}

          {(professionalTitle || academicTitle) && <Separator />}

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

      <CardFooter className="flex-shrink-0">{children}</CardFooter>
    </Card>
  );
}

const InfoItem = ({
  label,
  value,
  type = "text",
}: {
  label: string;
  value: string | number;
  type?: "text" | "code" | "time";
}) => {
  const renderValue = () => {
    switch (type) {
      case "code":
        return <code>{value}</code>;
      case "time":
        return <time dateTime={String(value)}>{value}</time>;
      default:
        return value;
    }
  };

  return (
    <div>
      <dt className="text-muted-foreground text-sm font-medium">{label}</dt>
      <dd className="text-foreground text-base font-normal">{renderValue()}</dd>
    </div>
  );
};
