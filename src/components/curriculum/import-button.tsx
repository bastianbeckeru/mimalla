"use client";

import { ArrowRight, Import, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import VersionHint from "@/components/curriculum/version-hint";
import { EntryDateFields } from "@/components/entry-date-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { useImportTrajectory } from "@/hooks/use-import-trajectory";
import { useHasHydrated, useTrajectoryStore } from "@/stores/trajectory";
import type { Program } from "@/types/curriculum";
import { getProgramPath } from "@/utils/curriculum";

export default function ImportCurriculumButton({
  program,
}: {
  program: Program;
}) {
  const hasHydrated = useHasHydrated();
  const isImported = useTrajectoryStore((state) =>
    state.trajectories.some(
      (t) => getProgramPath(t.curriculumPath) === program.path,
    ),
  );
  const { importTrajectory, isImporting } = useImportTrajectory();
  const [year, setYear] = useState<number | null>(null);
  const [term, setTerm] = useState<number | null>(null);
  const router = useRouter();

  if (hasHydrated && isImported) {
    return (
      <Button nativeButton={false} render={<Link href="/dashboard" />}>
        Ir a mi malla
        <ArrowRight data-icon="inline-end" />
      </Button>
    );
  }

  async function onImport() {
    if (!year || !term) return;
    if (await importTrajectory(program, { year, term }))
      router.push("/dashboard");
  }

  return (
    <Dialog>
      <DialogTrigger render={<Button />}>
        <Import data-icon="inline-start" />
        Importar malla
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar malla</DialogTitle>
          <DialogDescription>
            Crea tu malla a partir de esta malla curricular y marca los cursos
            que ya aprobaste.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Item variant="muted">
            <ItemMedia variant="icon" className="font-semibold text-xs">
              {program.institution.acronym}
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{program.name}</ItemTitle>
              <ItemDescription>{program.institution.name}</ItemDescription>
            </ItemContent>
          </Item>

          <Field>
            <FieldLabel htmlFor="entry-year">Ingreso</FieldLabel>
            <EntryDateFields
              year={year}
              term={term}
              onYearChange={setYear}
              onTermChange={setTerm}
            />
            <VersionHint
              effectiveYears={program.effectiveYears}
              entryYear={year}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button type="button" variant="ghost" />}>
            Cancelar
          </DialogClose>
          <Button
            type="submit"
            disabled={!year || !term || isImporting}
            onClick={onImport}
          >
            {isImporting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Importar
                <ArrowRight data-icon="inline-end" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
