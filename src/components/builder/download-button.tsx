"use client";

import { Download } from "lucide-react";
import { exportFile, getFileName, isExportable } from "@/builder/export";
import { Button } from "@/components/ui/button";
import type { Draft } from "@/types/builder";

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
  return (
    <Button
      disabled={!isExportable(draft)}
      onClick={() => downloadText(exportFile(draft), getFileName(draft))}
    >
      <Download />
      Descargar
    </Button>
  );
}
