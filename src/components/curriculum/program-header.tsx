import { cn } from "cn";
import { Award, Clock, GraduationCap, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { REGULAR_TERMS } from "@/builder/periods";
import ImportCurriculumButton from "@/components/curriculum/import-button";
import VersionSelect from "@/components/curriculum/version-select";
import { Separator } from "@/components/ui/separator";
import type { CredentialType, Curriculum } from "@/types/builder";
import type { Program } from "@/types/curriculum";

const CREDENTIAL_ORDER: CredentialType[] = [
  "professional",
  "academic",
  "technical",
  "certificate",
  "mention",
];

function getDuration({ termSystem, periods }: Curriculum) {
  const regularPeriods = periods.filter(({ term }) =>
    REGULAR_TERMS[termSystem].includes(term),
  ).length;
  return termSystem === "semester"
    ? `${regularPeriods} semestres`
    : `${regularPeriods} años`;
}

function MetaItem({
  icon,
  className,
  children,
}: {
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li
      className={cn(
        "flex items-center gap-1.5 [&_svg]:size-3.5 [&_svg]:shrink-0",
        className,
      )}
    >
      {icon}
      {children}
    </li>
  );
}

export default function ProgramHeader({
  program,
  curriculum,
}: {
  program: Program;
  curriculum: Curriculum;
}) {
  const credentials = curriculum.tracks
    .filter((track) => track.credentialType !== null)
    .toSorted(
      (a, b) =>
        CREDENTIAL_ORDER.indexOf(a.credentialType ?? "mention") -
        CREDENTIAL_ORDER.indexOf(b.credentialType ?? "mention"),
    );

  return (
    <header className="flex flex-col gap-4 px-4 py-5 lg:flex-row lg:items-end lg:justify-between lg:px-8">
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="text-muted-foreground text-sm">
          {program.institution.name}
        </p>
        <h1 className="font-heading font-semibold text-2xl tracking-tight">
          {curriculum.programName}
        </h1>
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
          {credentials.map((track) => (
            <MetaItem
              key={track.id}
              className="max-md:hidden"
              icon={
                track.credentialType === "academic" ? (
                  <GraduationCap />
                ) : (
                  <Award />
                )
              }
            >
              {track.name}
            </MetaItem>
          ))}
          {credentials.length > 0 && (
            <Separator
              orientation="vertical"
              className="self-center! h-3.5 max-md:hidden"
            />
          )}
          <MetaItem icon={<Sun />}>
            {program.schedule === "DAYTIME" ? "Diurna" : "Vespertina"}
          </MetaItem>
          <MetaItem icon={<Clock />}>{getDuration(curriculum)}</MetaItem>
        </ul>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <VersionSelect
          programPath={program.path}
          effectiveYears={program.effectiveYears}
          effectiveYear={curriculum.effectiveYear ?? 0}
        />
        <ImportCurriculumButton program={program} />
      </div>
    </header>
  );
}
