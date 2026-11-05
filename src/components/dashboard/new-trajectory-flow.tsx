"use client";

import { track } from "@vercel/analytics";
import { cn } from "cn";
import { ChevronLeftIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { type ReactNode, useState } from "react";
import VersionHint from "@/components/curriculum/version-hint";
import { AdaptiveSelect } from "@/components/ui/adaptive-select";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useImportTrajectory } from "@/hooks/use-import-trajectory";
import type {
  CatalogInstitution,
  CatalogProgram,
  Curriculum,
} from "@/types/curriculum";
import { ENTRY_TERMS } from "@/utils/period-key";

export const PROGRAM_PARAM = "programa";

const STEPS = [1, 2];
const FIRST_ENTRY_YEAR = 2020;
const PROGRAM_REQUEST_URL = "https://forms.gle/P6JjrCPn1y4fZyUNA";

const entryYearOptions = Array.from(
  { length: new Date().getFullYear() - FIRST_ENTRY_YEAR + 1 },
  (_, index) => String(FIRST_ENTRY_YEAR + index),
)
  .toReversed()
  .map((year) => ({ value: year, label: year }));

type RequestedProgram = {
  institution: CatalogInstitution;
  program: CatalogProgram;
};

export default function NewTrajectoryFlow({
  catalog,
  requested,
  onImport,
}: {
  catalog: CatalogInstitution[];
  requested: RequestedProgram | null;
  onImport: (curriculumPath: string, curriculum: Curriculum) => void;
}) {
  const [institution, setInstitution] = useState(
    requested?.institution ?? (catalog.length === 1 ? catalog[0] : undefined),
  );

  return (
    <div className="flex h-full flex-col">
      <header className="relative flex h-14 shrink-0 items-center px-2 md:px-4">
        {requested ? (
          <Button variant="ghost" onClick={goBack}>
            <ChevronLeftIcon data-icon="inline-start" />
            Volver
          </Button>
        ) : (
          <Link href="/" className={buttonVariants({ variant: "ghost" })}>
            <ChevronLeftIcon data-icon="inline-start" />
            Volver
          </Link>
        )}
        <StepDots currentStep={requested ? 2 : 1} />
      </header>

      <div className="flex min-h-0 flex-1 flex-col md:justify-center md:pb-14">
        {requested ? (
          <EntryStep
            key={requested.program.path}
            program={requested.program}
            onImport={onImport}
          />
        ) : (
          <ProgramStep
            catalog={catalog}
            institution={institution}
            onInstitutionChange={setInstitution}
          />
        )}
      </div>
    </div>
  );
}

function goBack() {
  if (window.history.length > 1) window.history.back();
  else window.location.assign("/dashboard");
}

function StepDots({ currentStep }: { currentStep: number }) {
  return (
    <div
      role="img"
      aria-label={`Paso ${currentStep} de ${STEPS.length}`}
      className="absolute left-1/2 flex -translate-x-1/2 items-center gap-1.5"
    >
      {STEPS.map((step) => (
        <span
          key={step}
          className={cn(
            "h-1.5 rounded-full transition-[width,background-color] duration-200 ease-out motion-reduce:transition-none",
            step === currentStep
              ? "w-5 bg-foreground"
              : "w-1.5 bg-foreground/25",
          )}
        />
      ))}
    </div>
  );
}

function Step({
  title,
  description,
  className,
  children,
}: {
  title: string;
  description: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "fade-in slide-in-from-bottom-2 mx-auto flex min-h-0 w-full max-w-md flex-1 animate-in flex-col gap-6 px-4 pt-2 pb-6 duration-200 ease-out motion-reduce:animate-none md:flex-none md:pt-0",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5">
        <h1 className="text-balance font-heading font-semibold text-2xl tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function ProgramStep({
  catalog,
  institution,
  onInstitutionChange,
}: {
  catalog: CatalogInstitution[];
  institution: CatalogInstitution | undefined;
  onInstitutionChange: (institution: CatalogInstitution | undefined) => void;
}) {
  function chooseProgram(program: CatalogProgram) {
    track("trajectory_program_chosen", { program: program.path });
    window.history.pushState(
      null,
      "",
      `/dashboard?${PROGRAM_PARAM}=${program.path}`,
    );
  }

  return (
    <Step
      title="¿Qué estudias?"
      description="Elige tu carrera para crear tu malla."
      className="md:h-136 md:max-h-full"
    >
      {catalog.length > 1 && (
        <Field className="shrink-0">
          <FieldLabel htmlFor="institution">Universidad</FieldLabel>
          <AdaptiveSelect
            id="institution"
            value={institution?.acronym ?? null}
            options={catalog.map(({ acronym, name }) => ({
              value: acronym,
              label: name,
            }))}
            placeholder="Selecciona una universidad"
            onValueChange={(acronym) =>
              onInstitutionChange(
                catalog.find((candidate) => candidate.acronym === acronym),
              )
            }
          />
        </Field>
      )}

      {institution && (
        <Command
          key={institution.acronym}
          className="min-h-0 flex-1 rounded-lg border bg-transparent"
        >
          <CommandInput
            aria-label="Buscar carrera"
            placeholder="Busca tu carrera"
            className="text-base md:text-sm"
          />
          <CommandList className="max-h-none flex-1 overscroll-contain">
            <CommandEmpty>No se encontraron coincidencias.</CommandEmpty>
            {institution.departments.map((department) => (
              <CommandGroup key={department.name} heading={department.name}>
                {department.programs.map((program) => (
                  <CommandItem
                    key={program.path}
                    value={program.name}
                    className="min-h-11 pointer-coarse:active:bg-muted pointer-coarse:data-selected:bg-transparent md:min-h-8"
                    onSelect={() => chooseProgram(program)}
                  >
                    {program.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      )}

      <p className="mt-auto shrink-0 text-muted-foreground text-xs">
        ¿No encuentras tu carrera?{" "}
        <a
          target="_blank"
          rel="noreferrer"
          href={PROGRAM_REQUEST_URL}
          className="underline underline-offset-4 hover:text-foreground"
        >
          Solicítala aquí
        </a>
      </p>
    </Step>
  );
}

function EntryStep({
  program,
  onImport,
}: {
  program: CatalogProgram;
  onImport: (curriculumPath: string, curriculum: Curriculum) => void;
}) {
  const { importTrajectory, isImporting } = useImportTrajectory();
  const [year, setYear] = useState<string | null>(null);
  const [term, setTerm] = useState<number | null>(null);

  async function createTrajectory() {
    if (!year || !term) return;

    const imported = await importTrajectory(program, {
      year: Number(year),
      term,
    });
    if (!imported) return;

    track("trajectory_created", { program: program.path });
    onImport(imported.curriculumPath, imported.curriculum);
  }

  return (
    <Step title="¿Cuándo ingresaste?" description={program.name}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="entry-year">Año</FieldLabel>
          <AdaptiveSelect
            id="entry-year"
            value={year}
            options={entryYearOptions}
            placeholder="Selecciona un año"
            onValueChange={setYear}
          />
          <VersionHint
            effectiveYears={program.effectiveYears}
            entryYear={year ? Number(year) : null}
          />
        </Field>
        <Field>
          <FieldTitle>Semestre</FieldTitle>
          <ToggleGroup
            aria-label="Semestre de ingreso"
            variant="outline"
            spacing={0}
            value={term ? [String(term)] : []}
            className="w-full"
            onValueChange={([value]) => {
              if (value) setTerm(Number(value));
            }}
          >
            {ENTRY_TERMS.map(({ value, label }) => (
              <ToggleGroupItem
                key={value}
                value={String(value)}
                className="h-10 flex-1 md:h-8"
              >
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      </FieldGroup>

      <Button
        className="mt-auto h-11 w-full md:mt-0 md:h-9"
        disabled={!year || !term || isImporting}
        onClick={createTrajectory}
      >
        {isImporting ? <Loader2 className="animate-spin" /> : "Crear mi malla"}
      </Button>
    </Step>
  );
}
