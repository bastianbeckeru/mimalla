"use client";

import { ArrowRight, Import } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { useState } from "react";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import type { CurriculumData } from "@/types/curriculum";
import { useRouter } from "next/navigation";
import { slugify } from "@/utils/strings";
import Link from "next/link";

const years = [2020, 2021, 2022, 2023, 2024, 2025];
const periods = [
  { value: 1, label: "Primer semestre" },
  { value: 2, label: "Segundo semestre" },
];

type Props = {
  curriculum: CurriculumData["curriculum"];
  institution: CurriculumData["institution"];
  program: CurriculumData["program"];
};

export default function ImportCurriculumButton({
  curriculum,
  institution,
  program,
}: Props) {
  const { addCurriculum, curriculums } = useNewCurriculumStore();
  const [year, setYear] = useState<number>();
  const [period, setPeriod] = useState<number>();
  const router = useRouter();

  const path = slugify(institution.acronym, program.name);

  if (curriculums.some((c) => c.path === path)) {
    return (
      <Button className="w-full" asChild>
        <Link href="/dashboard">
          Ir a mi malla
          <ArrowRight />
        </Link>
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="accent" className="w-full">
          <Import /> Importar malla
        </Button>
      </DialogTrigger>
      <DialogContent className="min-h-48">
        <DialogHeader>
          <DialogTitle>Importar malla curricular</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pb-4">
          <dl>
            <div className="flex flex-row gap-2">
              <dt className="text-muted-foreground font-medium">
                Universidad:
              </dt>
              <dd className="text-foreground flex-1">{institution.name}</dd>
            </div>
            <div className="flex flex-row gap-2">
              <dt className="text-muted-foreground font-medium">Programa:</dt>
              <dd className="text-foreground flex-1">{program.name}</dd>
            </div>
            <div className="flex flex-row gap-2">
              <dt className="text-muted-foreground font-medium">Versión:</dt>
              <dd className="text-foreground flex-1">{2020}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2">
            <h3 className="text-muted-foreground font-medium">Ingreso</h3>
            <div className="flex flex-row gap-2 md:flex-row">
              <Select
                onValueChange={(value) => setYear(parseInt(value))}
                value={year?.toString()}
              >
                <SelectTrigger id="year" className="w-1/3">
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
              >
                <SelectTrigger id=" semester" className="w-2/3">
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

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={!year || !period}
            onClick={() => {
              if (!year || !period) return;

              console.log("Importing curriculum...");
              addCurriculum({
                year: year,
                term: period,
                path: path,
                slots: curriculum.structure,
              });
              //setEditMode(true)
              router.push("/dashboard");
            }}
          >
            Importar 🚀
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
