"use client";

import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { Draft } from "@/builder/draft";
import { importFile } from "@/builder/import";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

export default function ImportButton({
  onLoad,
}: {
  onLoad: (draft: Draft) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);

  async function readFile(file: File) {
    const result = importFile(await file.text());
    if (result.ok) {
      setPendingDraft(result.draft);
      return;
    }
    toast.add({
      type: "error",
      title: "No se pudo cargar el archivo",
      description: result.reason,
    });
  }

  return (
    <>
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
      <Button variant="outline" onClick={() => inputRef.current?.click()}>
        <Upload /> Cargar archivo
      </Button>
      <Dialog
        open={pendingDraft !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDraft(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar malla</DialogTitle>
            <DialogDescription>
              La malla «{pendingDraft?.curriculum.programName}» reemplaza la
              malla actual y todos sus cursos. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingDraft) onLoad(pendingDraft);
                setPendingDraft(null);
              }}
            >
              Reemplazar malla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
