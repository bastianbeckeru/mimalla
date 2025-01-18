"use client";

import { Import } from "lucide-react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
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
import { createUrlSlug } from "@/utils/strings";

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
  const { addCurriculum } = useNewCurriculumStore();
  const [year, setYear] = useState<number>();
  const [period, setPeriod] = useState<number>();
  const router = useRouter();

  const path = `${institution.acronym.toLocaleLowerCase()}/${createUrlSlug(program.name)}`;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full">
          <Import /> Importar malla
        </Button>
      </DialogTrigger>
      <DialogContent className="min-h-48">
        <DialogTitle>Importar Malla</DialogTitle>
        <div className="flex flex-col gap-2">
          <div>
            <div className="flex flex-row gap-2">
              <h3 className="text-muted-foreground">Programa:</h3>
              <span className="text-foreground">{program.name}</span>
            </div>
            <div className="flex flex-row gap-2">
              <h3 className="text-muted-foreground">Universidad:</h3>
              <span className="text-foreground">{institution.name}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-muted-foreground">Ingreso</h3>
            <div className="flex flex-col gap-2 md:flex-row">
              <Select
                onValueChange={(value) => setYear(parseInt(value))}
                value={year?.toString()}
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

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={() => {
              if (!year || !period) return;
              console.log("Importing curriculum...");
              addCurriculum({
                year: year,
                term: period,
                path: path,
                slots: curriculum.slots,
              });
              router.push("/dashboard");
            }}
            disabled={!year || !period}
          >
            Importar 🚀
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
