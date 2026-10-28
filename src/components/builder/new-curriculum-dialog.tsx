"use client";

import { FilePlus } from "lucide-react";
import { useState } from "react";
import CurriculumSetupForm from "@/components/builder/curriculum-setup-form";
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
import type { Action } from "@/types/builder";

export default function NewCurriculumDialog({
  dispatch,
}: {
  dispatch: (action: Action) => void;
}) {
  const [open, setOpen] = useState(false);

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
        <CurriculumSetupForm
          onSubmit={(termSystem, details) => {
            dispatch({ type: "createCurriculum", termSystem, details });
            setOpen(false);
          }}
        >
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancelar
            </DialogClose>
            <Button type="submit" variant="destructive">
              Reemplazar malla
            </Button>
          </DialogFooter>
        </CurriculumSetupForm>
      </DialogContent>
    </Dialog>
  );
}
