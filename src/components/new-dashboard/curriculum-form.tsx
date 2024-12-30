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

import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { createUrlSlug } from "@/utils/strings";
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

// Should we add "isAvailable" field to the program object?
const institutions = [
  {
    acronym: "UDP",
    name: "Universidad Diego Portales",
    departments: [
      {
        name: "Facultad de Ingeniería y Ciencias",
        programs: [
          { name: "Ingeniería Civil Industrial", siesCode: "I3S1C10J1V1" },
          { name: "Ingeniería Civil Plan Común", siesCode: "I3S1C300J1V1" },
        ],
      },
    ],
  },
];

const years = [2020, 2021, 2022, 2023, 2024, 2025];

const periods = [
  { value: 1, label: "Primer semestre" },
  { value: 2, label: "Segundo semestre" },
];

export default function CurriculumForm() {
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
    const programSlug = createUrlSlug(selectedProgram.name);

    try {
      const data = await getProgramData({
        institutionAcronym: institutionAcronym,
        programSlug: programSlug,
      });

      addCurriculum({
        year: year,
        term: period,
        path: `{${institutionAcronym}}/{${programSlug}}`,
        slots: data.curriculum.slots,
      });
      router.push("/test");

      toast({
        title: "✅ Malla importada",
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
          "absolute left-4 top-4 md:left-8 md:top-8",
        )}
      >
        <ChevronLeftIcon className="mr-2 size-4" />
        Volver
      </Link>

      <div className="flex w-full flex-col justify-center space-y-2 px-2 sm:w-[350px]">
        <div className="mb-2 flex flex-col space-y-2 text-center">
          <h1 className="flex items-center gap-2">
            <span className="text-2xl font-semibold tracking-tight">
              Crea tu malla de estudios
            </span>
          </h1>
          <p className="text-left text-sm text-muted-foreground">
            Comienza seleccionando tu carrera y datos de ingreso
          </p>
        </div>

        <div className="space-y-2">
          <div className="space-y-2">
            <Select
              onValueChange={(value) => {
                const selected = institutions.find(
                  (inst) => inst.acronym === value,
                );
                setSelectedInstitution(selected);
              }}
              value={selectedInstitution?.acronym}
              disabled={institutions.length === 1}
            >
              <SelectTrigger id="institution">
                <SelectValue placeholder="Selecciona una universidad" />
              </SelectTrigger>
              <SelectContent className="w-96">
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

            <div className="flex h-14 w-full flex-col items-end justify-start">
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
                  href={`${selectedInstitution?.acronym.toLowerCase()}/${createUrlSlug(selectedProgram.name)}`}
                  className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Ver malla
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <h3 className="font-semibold text-muted-foreground">Ingreso</h3>
            <div className="flex flex-row gap-2">
              <Select
                onValueChange={(value) => setYear(parseInt(value))}
                value={year?.toString()}
                disabled={!selectedProgram}
              >
                <SelectTrigger id="year">
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
                onValueChange={(value) => setPeriod(parseInt(value))}
                value={period?.toString()}
                disabled={!selectedProgram}
              >
                <SelectTrigger id=" semester">
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

        <div className="space-y-px">
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

          <p className="px-4 text-center text-sm text-muted-foreground">
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
  departments: Department[];
  setOpen: (open: boolean) => void;
  setSelectedProgram: (program: Program) => void;
}) {
  return (
    <Command>
      <CommandInput placeholder="Escribe una carrera..." />
      <CommandList>
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
