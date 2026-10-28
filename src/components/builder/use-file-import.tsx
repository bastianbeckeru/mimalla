"use client";

import { useRef } from "react";
import { importFile } from "@/builder/import";
import { toast } from "@/components/ui/toast";
import type { Draft } from "@/types/builder";

/** Opens a file picker and loads the chosen builder file as a new curriculum. */
export function useFileImport(onLoad: (draft: Draft) => void) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function readFile(file: File) {
    const result = importFile(await file.text());
    if (result.ok) {
      onLoad(result.draft);
      return;
    }
    toast.add({
      type: "error",
      title: "No se pudo cargar el archivo",
      description: result.reason,
    });
  }

  return {
    open: () => inputRef.current?.click(),
    input: (
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) void readFile(file);
        }}
      />
    ),
  };
}
