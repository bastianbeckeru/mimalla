"use client";

import { ArrowRight, Import } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

  if (hasHydrated && isImported) {
    return (
      <Button nativeButton={false} render={<Link href="/dashboard" />}>
        Ir a mi malla
        <ArrowRight data-icon="inline-end" />
      </Button>
    );
  }

  return (
    <Button
      nativeButton={false}
      render={<Link href={`/dashboard?programa=${program.path}`} />}
    >
      <Import data-icon="inline-start" />
      Importar malla
    </Button>
  );
}
