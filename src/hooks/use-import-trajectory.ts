import { useState } from "react";
import { toast } from "@/components/ui/toast";
import { useTrajectoryStore } from "@/stores/trajectory";
import type { CatalogProgram } from "@/types/curriculum";
import type { Entry } from "@/types/trajectory";
import { getApplicableYear, getCurriculumPath } from "@/utils/curriculum";
import { fetchCurriculum } from "@/utils/curriculum-file";

export function useImportTrajectory() {
  const addTrajectory = useTrajectoryStore((state) => state.addTrajectory);
  const [isImporting, setIsImporting] = useState(false);

  async function importTrajectory(program: CatalogProgram, entry: Entry) {
    const effectiveYear = getApplicableYear(program.effectiveYears, entry.year);
    const curriculumPath = getCurriculumPath(program.path, effectiveYear);
    setIsImporting(true);

    try {
      const curriculum = await fetchCurriculum(curriculumPath);
      addTrajectory({ curriculumPath, entry, curriculum });
      toast.add({
        type: "success",
        title: "Malla importada",
        description: `${curriculum.programName} ${effectiveYear}`,
      });
      return { curriculumPath, curriculum };
    } catch {
      toast.add({
        type: "error",
        title: "No se pudo importar la malla",
        description: "Inténtalo nuevamente en unos segundos.",
      });
      setIsImporting(false);
      return null;
    }
  }

  return { importTrajectory, isImporting };
}
