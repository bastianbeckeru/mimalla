import { toast } from "@/components/ui/toast";
import type { ChangeNotice } from "@/types/trajectory";
import { type EditError, MAX_ENROLLMENTS_PER_PERIOD } from "@/utils/trajectory";

export const EDIT_ERROR_DESCRIPTIONS: Record<EditError, string> = {
  PERIOD_FULL: `Un periodo no puede tener más de ${MAX_ENROLLMENTS_PER_PERIOD} cursos.`,
  DUPLICATE_COURSE: "Este periodo ya tiene este curso.",
  SUCCESSOR_IN_PERIOD: "Este periodo tiene un curso que lo requiere.",
  PREREQUISITE_IN_PERIOD: "Este periodo tiene uno de sus prerrequisitos.",
  SUCCESSOR_ON_THE_WAY: "Hay un curso que lo requiere en el camino.",
  PREREQUISITE_ON_THE_WAY: "Hay uno de sus prerrequisitos en el camino.",
};

export function getStatusNotice(
  title: string,
  revertedCount: number,
): ChangeNotice {
  if (revertedCount === 0) return { title };
  return {
    title,
    description:
      revertedCount === 1
        ? "1 curso que lo requería volvió a pendiente."
        : `${revertedCount} cursos que lo requerían volvieron a pendiente.`,
    isShownOnDesktop: true,
  };
}

export function showEditError(title: string, error: EditError) {
  toast.add({
    type: "error",
    title,
    description: EDIT_ERROR_DESCRIPTIONS[error],
  });
}
