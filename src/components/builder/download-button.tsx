"use client";

import { Download } from "lucide-react";
import type { Draft } from "@/builder/draft";
import { exportFile, getFileName, getMissingDetails } from "@/builder/export";
import { Button } from "@/components/ui/button";

const DETAIL_LABELS = {
  programName: "el nombre del programa",
  effectiveYear: "el año de vigencia (entre 1900 y 2100)",
};

function downloadText(text: string, fileName: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function DownloadButton({ draft }: { draft: Draft }) {
  const missingDetails = getMissingDetails(draft);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        disabled={missingDetails.length > 0}
        onClick={() => downloadText(exportFile(draft), getFileName(draft))}
      >
        <Download />
        Descargar
      </Button>
      {missingDetails.length > 0 && (
        <p className="text-muted-foreground text-xs">
          Falta{" "}
          {missingDetails.map((detail) => DETAIL_LABELS[detail]).join(" y ")}
        </p>
      )}
    </div>
  );
}
