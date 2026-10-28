"use client";

import { Download } from "lucide-react";
import { exportFile, getFileName, isExportable } from "@/builder/export";
import { Button } from "@/components/ui/button";
import type { Draft } from "@/types/builder";

export function downloadDraft(draft: Draft) {
  const url = URL.createObjectURL(
    new Blob([exportFile(draft)], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = getFileName(draft);
  link.click();
  URL.revokeObjectURL(url);
}

export default function DownloadButton({ draft }: { draft: Draft }) {
  return (
    <Button
      disabled={!isExportable(draft)}
      onClick={() => downloadDraft(draft)}
    >
      <Download />
      Descargar
    </Button>
  );
}
