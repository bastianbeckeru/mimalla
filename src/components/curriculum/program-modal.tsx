import {
  type Program,
  ProgramStats,
} from "@/components/curriculum/program-stats";
import { ResponsiveDialog } from "@/components/responsive-dialog";

export default function ProgramModal({ program }: { program: Program }) {
  if (!program.stats?.length) return null;

  return (
    <ResponsiveDialog
      trigger="Ver estadísticas"
      title="Estadísticas"
      description={`Visualización de estadísticas del programa académico ${program.name}.`}
      isDescriptionHidden
    >
      <ProgramStats program={program} />
    </ResponsiveDialog>
  );
}
