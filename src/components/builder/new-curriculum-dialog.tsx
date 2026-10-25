"use client";

import { FilePlus } from "lucide-react";
import { useState } from "react";
import type { Action } from "@/builder/apply";
import type { TermSystem } from "@/builder/draft";
import TermSystemSelect from "@/components/builder/term-system-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function NewCurriculumDialog({
  dispatch,
}: {
  dispatch: (action: Action) => void;
}) {
  const [open, setOpen] = useState(false);
  const [termSystem, setTermSystem] = useState<TermSystem>("semester");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <FilePlus /> Nueva malla
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva malla</DialogTitle>
          <DialogDescription>
            La nueva malla reemplaza la malla actual y todos sus cursos. Esta
            acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="new-curriculum-term-system">Régimen</Label>
          <TermSystemSelect
            id="new-curriculum-term-system"
            value={termSystem}
            onChange={setTermSystem}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancelar
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              dispatch({ type: "createCurriculum", termSystem });
              setOpen(false);
            }}
          >
            Reemplazar malla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
