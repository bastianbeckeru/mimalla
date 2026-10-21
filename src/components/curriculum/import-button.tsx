"use client";

import { ArrowRight, Import } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import type { CurriculumData } from "@/types/curriculum";
import { slugify } from "@/utils/strings";

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
      <Button
        className="w-full"
        nativeButton={false}
        render={<Link href="/dashboard" />}
      >
        Ir a mi malla
        <ArrowRight />
      </Button>
    );
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button className="w-full bg-accent text-foreground hover:bg-accent/90" />
        }
      >
        <Import /> Importar malla
      </DialogTrigger>
      <DialogContent className="min-h-48">
        <DialogHeader>
          <DialogTitle>Importar malla curricular</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pb-4">
          <dl>
            <div className="flex flex-row gap-2">
              <dt className="font-medium text-muted-foreground">
                Universidad:
              </dt>
              <dd className="flex-1 text-foreground">{institution.name}</dd>
            </div>
            <div className="flex flex-row gap-2">
              <dt className="font-medium text-muted-foreground">Programa:</dt>
              <dd className="flex-1 text-foreground">{program.name}</dd>
            </div>
            <div className="flex flex-row gap-2">
              <dt className="font-medium text-muted-foreground">Versión:</dt>
              <dd className="flex-1 text-foreground">{2020}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2">
            <h3 className="font-medium text-muted-foreground">Ingreso</h3>
            <div className="flex flex-row gap-2 md:flex-row">
              <Select
                onValueChange={(value: number | null) =>
                  setYear(value ?? undefined)
                }
                value={year ?? null}
              >
                <SelectTrigger id="year" className="w-1/3">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {years.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <Select
                items={periods}
                onValueChange={(value: number | null) =>
                  setPeriod(value ?? undefined)
                }
                value={period ?? null}
              >
                <SelectTrigger id=" semester" className="w-2/3">
                  <SelectValue placeholder="Semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {periods.map((period) => (
                      <SelectItem key={period.value} value={period.value}>
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
          <DialogClose render={<Button type="button" variant="ghost" />}>
            Cancelar
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
