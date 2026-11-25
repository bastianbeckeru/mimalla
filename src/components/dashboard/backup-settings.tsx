"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { downloadTrajectory } from "@/components/dashboard/download-trajectory";
import ImportTrajectoryDialog from "@/components/dashboard/import-trajectory-dialog";
import {
  ROW_CLASS,
  RowText,
  SettingsGroup,
} from "@/components/dashboard/settings-layout";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import type { TrajectorySettings } from "@/types/settings";

export default function BackupSettings({
  trajectory,
  curriculum,
  onImport,
}: Pick<TrajectorySettings, "trajectory" | "curriculum" | "onImport">) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  async function download() {
    setIsDownloading(true);
    try {
      await downloadTrajectory(trajectory, curriculum);
    } catch {
      toast.add({
        type: "error",
        title: "No se pudo descargar tu progreso",
        description: "Inténtalo nuevamente en unos segundos.",
      });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <SettingsGroup
      title="Respaldo"
      description="Un archivo .xlsx con tus cursos y notas, para guardarlos, editarlos o llevarlos a otro dispositivo."
    >
      <div className={ROW_CLASS}>
        <RowText
          label="Descargar progreso"
          description="Guarda esta malla en un archivo."
        />
        <Button
          variant="outline"
          className="shrink-0"
          disabled={isDownloading}
          onClick={download}
        >
          {isDownloading && <Loader2 className="animate-spin" />}
          Descargar
        </Button>
      </div>
      <div className={ROW_CLASS}>
        <RowText
          label="Cargar progreso"
          description="Reemplaza esta malla con un archivo."
        />
        <Button
          variant="outline"
          className="shrink-0"
          onClick={() => setIsImporting(true)}
        >
          Cargar
        </Button>
        <ImportTrajectoryDialog
          open={isImporting}
          onOpenChange={setIsImporting}
          target={{ curriculumPath: trajectory.curriculumPath, curriculum }}
          current={trajectory.enrollments}
          onImport={({ entry, gradingScale, enrollments }) =>
            onImport({ entry, gradingScale, enrollments })
          }
        />
      </div>
    </SettingsGroup>
  );
}
