"use client";

import { useState } from "react";
import { courseNameSchema } from "@/builder/schemas";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function NewCourseForm({ onCreate }: { onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const result = courseNameSchema.safeParse(name);
  const error = isSubmitted ? result.error?.issues[0]?.message : undefined;

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setIsSubmitted(true);
        if (result.success) onCreate(result.data);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="builder-new-course-name">Nombre</Label>
        <Input
          id="builder-new-course-name"
          placeholder="Derecho Civil I"
          required
          autoFocus
          aria-invalid={error !== undefined}
          aria-describedby="builder-new-course-name-error"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {error && (
          <p
            id="builder-new-course-name-error"
            className="text-destructive text-xs"
          >
            {error}
          </p>
        )}
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button type="submit">Crear curso</Button>
      </DialogFooter>
    </form>
  );
}

export default function NewCourseDialog({
  open,
  periodLabel,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  periodLabel: string;
  onOpenChange: (open: boolean) => void;
  onCreate: (name: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo curso</DialogTitle>
          <DialogDescription>
            El curso se agregará en {periodLabel}.
          </DialogDescription>
        </DialogHeader>
        <NewCourseForm onCreate={onCreate} />
      </DialogContent>
    </Dialog>
  );
}
