"use client";

import { ArrowRight, Import } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EntryDateFields } from "@/components/entry-date-fields";
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
import { useHasHydrated, useTrajectoryStore } from "@/stores/trajectory";
import type { CurriculumData } from "@/types/curriculum";

type Props = {
  path: string;
  curriculum: CurriculumData["curriculum"];
  institution: CurriculumData["institution"];
  program: CurriculumData["program"];
};

export default function ImportCurriculumButton({
  path,
  curriculum,
  institution,
  program,
}: Props) {
  const hasHydrated = useHasHydrated();
  const addTrajectory = useTrajectoryStore((state) => state.addTrajectory);
  const isImported = useTrajectoryStore((state) =>
    state.trajectories.some((t) => t.curriculumPath === path),
  );
  const [year, setYear] = useState<number | null>(null);
  const [term, setTerm] = useState<number | null>(null);
  const router = useRouter();

  if (hasHydrated && isImported) {
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
              <dd className="flex-1 text-foreground">{curriculum.year}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-2">
            <h3 className="font-medium text-muted-foreground">Ingreso</h3>
            <EntryDateFields
              year={year}
              term={term}
              onYearChange={setYear}
              onTermChange={setTerm}
            />
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="ghost" />}>
            Cancelar
          </DialogClose>
          <Button
            type="submit"
            disabled={!year || !term}
            onClick={() => {
              if (!year || !term) return;

              addTrajectory({
                curriculumPath: path,
                entry: { year, term },
                slots: curriculum.slots,
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
