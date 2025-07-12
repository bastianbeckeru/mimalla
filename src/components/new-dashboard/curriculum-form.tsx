"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { slugify } from "@/utils/strings";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChevronLeftIcon, Loader2 } from "lucide-react";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { getProgramData } from "@/utils/curriculum-data";
import type { CurriculumData } from "@/types/curriculum";
import { institutions } from "@/server/db/data";

type Institution = {
  acronym: string;
  name: string;
  departments: Department[];
};

type Department = {
  name: string;
  programs: Program[];
};

type Program = {
  name: string;
  siesCode: string;
};

const years = [2020, 2021, 2022, 2023, 2024, 2025];

const periods = [
  { value: 1, label: "Primer semestre" },
  { value: 2, label: "Segundo semestre" },
];

export default function CurriculumForm({
  setData,
}: {
  setData: (data: CurriculumData) => void;
}) {
  const router = useRouter();
  const { addCurriculum } = useNewCurriculumStore();

  const [selectedInstitution, setSelectedInstitution] = useState<
    Institution | undefined
  >(institutions.length === 1 ? institutions[0] : undefined);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [year, setYear] = useState<number>();
  const [period, setPeriod] = useState<number>();

  const [open, setOpen] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  async function onSubmit() {
    console.log("Importing curriculum...");
    if (!selectedInstitution || !selectedProgram || !year || !period) return;

    setIsCreating(true);

    const institutionAcronym = selectedInstitution.acronym.toLowerCase();
    const programSlug = slugify(selectedProgram.name);

    try {
      const data = await getProgramData({
        institutionAcronym: institutionAcronym,
        programSlug: programSlug,
      });

      addCurriculum({
        year: year,
        term: period,
        path: `${institutionAcronym}/${programSlug}`,
        slots: data.curriculum.structure,
      });

      setData(data);

      toast("✅ Malla importada", {
        description: `${data.program.name} ${data.curriculum.year}`,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      router.push("/");
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
          <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-center">
            Crea tu malla de estudios
          </h1>
          <p className="text-muted-foreground">
            Comienza seleccionando tu carrera y datos de ingreso
          </p>
        </div>

        <div className="gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-muted-foreground hidden font-semibold">
              Carrera
            </h3>

            <div className="flex flex-col gap-2">
              <Select
                value={selectedInstitution?.acronym}
                onValueChange={(value) => {
                  const selected = institutions.find(
                    (inst) => inst.acronym === value,
                  );
                  setSelectedInstitution(selected);
                }}
                disabled={institutions.length === 1}
              >
                <SelectTrigger id="institution" className="w-full">
                  <SelectValue placeholder="Selecciona una universidad" />
                </SelectTrigger>
                <SelectContent>
                  {institutions.map((institution) => (
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
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      disabled={!selectedInstitution}
                    >
                      {selectedProgram ? (
                        <>{selectedProgram.name}</>
                      ) : (
                        <>Selecciona una carrera</>
                      )}
                    </Button>
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
                    href={slugify(
                      selectedInstitution!.acronym,
                      selectedProgram!.name,
                    )}
                    className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4"
                  >
                    Ver malla
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-muted-foreground font-semibold">Ingreso</h3>

            <div className="flex flex-row gap-2">
              <Select
                value={year?.toString()}
                onValueChange={(value) => setYear(parseInt(value))}
                disabled={!selectedProgram}
              >
                <SelectTrigger id="year" className="min-w-24">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                value={period?.toString()}
                onValueChange={(value) => setPeriod(parseInt(value))}
                disabled={!selectedProgram}
              >
                <SelectTrigger id="semester" className="flex-1">
                  <SelectValue placeholder="Semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {periods.map((period) => (
                      <SelectItem
                        key={period.value}
                        value={period.value.toString()}
                      >
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={!selectedProgram || !year || !period || isCreating}
            onClick={onSubmit}
          >
            {isCreating ? (
              <Loader2 className="animate-spin" />
            ) : (
              "Importar malla ✨"
            )}
          </Button>

          <p className="text-muted-foreground text-left text-xs">
            ¿No encuentras tu carrera?{" "}
            <a
              aria-label="No encontraste tu carrera? Rellena este formulario para solicitarla!"
              target="_blank"
              rel="noreferrer"
              href="https://forms.gle/P6JjrCPn1y4fZyUNA"
              className="hover:text-foreground underline underline-offset-4"
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
  departments: Department[];
  setOpen: (open: boolean) => void;
  setSelectedProgram: (program: Program) => void;
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
                key={program.siesCode}
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
