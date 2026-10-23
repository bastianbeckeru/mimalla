"use client";

import { cn } from "cn";
import { ChevronLeftIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EntryDateFields } from "@/components/entry-date-fields";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurriculumStore } from "@/stores/curriculum";
import type {
  CatalogDepartment,
  CatalogInstitution,
  CatalogProgram,
  CurriculumData,
} from "@/types/curriculum";
import { fetchProgramData } from "@/utils/curriculum-data";

export default function CurriculumForm({
  catalog,
  onImport,
}: {
  catalog: CatalogInstitution[];
  onImport: (path: string, data: CurriculumData) => void;
}) {
  const { addCurriculum } = useCurriculumStore();

  const [selectedInstitution, setSelectedInstitution] = useState(
    catalog.length === 1 ? catalog[0] : undefined,
  );
  const [selectedProgram, setSelectedProgram] = useState<CatalogProgram>();
  const [year, setYear] = useState<number | null>(null);
  const [term, setTerm] = useState<number | null>(null);

  const [open, setOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const institutionOptions = catalog.map((institution) => ({
    value: institution.acronym,
    label: institution.name,
  }));

  async function onSubmit() {
    if (!selectedProgram || !year || !term) return;

    setIsCreating(true);

    try {
      const data = await fetchProgramData(selectedProgram.path);

      onImport(selectedProgram.path, data);
      addCurriculum({
        path: selectedProgram.path,
        year,
        term,
        slots: data.curriculum.structure,
      });

      toast("✅ Malla importada", {
        description: `${data.program.name} ${data.curriculum.year}`,
      });
    } catch {
      toast("❌ No se pudo importar la malla", {
        description: "Inténtalo nuevamente en unos segundos.",
      });
      setIsCreating(false);
    }
  }

  return (
    <div className="container flex h-full items-center justify-center">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute top-0 left-0 m-4 md:top-8 md:left-8",
        )}
      >
        <ChevronLeftIcon className="mr-2" />
        Volver
      </Link>

      <div className="mx-10 flex w-full flex-col justify-center gap-6 md:w-80">
        <div className="flex flex-col gap-2 text-left">
          <h1 className="text-balance font-semibold text-2xl tracking-tight md:text-center">
            Crea tu malla de estudios
          </h1>
          <p className="text-muted-foreground">
            Comienza seleccionando tu carrera y datos de ingreso
          </p>
        </div>

        <div className="gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex flex-col gap-2">
              <Select
                items={institutionOptions}
                value={selectedInstitution?.acronym ?? null}
                onValueChange={(value: string | null) => {
                  setSelectedInstitution(
                    catalog.find((inst) => inst.acronym === value),
                  );
                  setSelectedProgram(undefined);
                }}
                disabled={catalog.length === 1}
              >
                <SelectTrigger id="institution" className="w-full">
                  <SelectValue placeholder="Selecciona una universidad" />
                </SelectTrigger>
                <SelectContent>
                  {catalog.map((institution) => (
                    <SelectItem
                      key={institution.acronym}
                      value={institution.acronym}
                    >
                      {institution.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex h-14 w-full flex-col items-end justify-start gap-1">
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger
                    render={
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        disabled={!selectedInstitution}
                      />
                    }
                  >
                    {selectedProgram
                      ? selectedProgram.name
                      : "Selecciona una carrera"}
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="start">
                    <ProgramList
                      departments={selectedInstitution?.departments ?? []}
                      setOpen={setOpen}
                      setSelectedProgram={setSelectedProgram}
                    />
                  </PopoverContent>
                </Popover>

                {selectedProgram && (
                  <Link
                    href={`/${selectedProgram.path}`}
                    className="text-muted-foreground text-xs underline underline-offset-4 hover:text-foreground"
                  >
                    Ver malla
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-semibold text-muted-foreground">Ingreso</h3>

            <EntryDateFields
              year={year}
              term={term}
              onYearChange={setYear}
              onTermChange={setTerm}
              disabled={!selectedProgram}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={!selectedProgram || !year || !term || isCreating}
            onClick={onSubmit}
          >
            {isCreating ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Importar malla ✨"
            )}
          </Button>

          <p className="text-left text-muted-foreground text-xs">
            ¿No encuentras tu carrera?{" "}
            <a
              aria-label="No encontraste tu carrera? Rellena este formulario para solicitarla!"
              target="_blank"
              rel="noreferrer"
              href="https://forms.gle/P6JjrCPn1y4fZyUNA"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Haz clic aquí
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function ProgramList({
  setOpen,
  setSelectedProgram,
  departments,
}: {
  departments: CatalogDepartment[];
  setOpen: (open: boolean) => void;
  setSelectedProgram: (program: CatalogProgram) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Escribe una carrera..." />
      <CommandList className="max-h-64 overflow-y-auto">
        <CommandEmpty>No se encontraron coincidencias.</CommandEmpty>
        {departments.map((department) => (
          <CommandGroup key={department.name} heading={department.name}>
            {department.programs.map((program) => (
              <CommandItem
                key={program.path}
                value={program.name}
                onSelect={() => {
                  setSelectedProgram(program);
                  setOpen(false);
                }}
                className="truncate"
              >
                {program.name}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </Command>
  );
}
