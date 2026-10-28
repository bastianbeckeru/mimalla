"use client";

import { type ReactNode, useId, useState } from "react";
import { z } from "zod";
import { detailsSchema } from "@/builder/schemas";
import TermSystemSelect from "@/components/builder/term-system-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CurriculumDetails, TermSystem } from "@/types/builder";

function FieldError({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.[0]) return null;
  return (
    <p id={id} className="text-destructive text-xs">
      {errors[0]}
    </p>
  );
}

export default function CurriculumSetupForm({
  onSubmit,
  children,
}: {
  onSubmit: (termSystem: TermSystem, details: CurriculumDetails) => void;
  children: ReactNode;
}) {
  const id = useId();
  const [programName, setProgramName] = useState("");
  const [institution, setInstitution] = useState("");
  const [effectiveYear, setEffectiveYear] = useState("");
  const [versionName, setVersionName] = useState("");
  const [termSystem, setTermSystem] = useState<TermSystem>("semester");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const result = detailsSchema.safeParse({
    programName,
    institution,
    effectiveYear: effectiveYear === "" ? undefined : Number(effectiveYear),
    versionName,
  });
  const errors =
    isSubmitted && !result.success
      ? z.flattenError(result.error).fieldErrors
      : {};

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setIsSubmitted(true);
        if (result.success) onSubmit(termSystem, result.data);
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-program-name`}>Programa</Label>
        <Input
          id={`${id}-program-name`}
          placeholder="Derecho"
          required
          autoFocus
          aria-invalid={errors.programName !== undefined}
          aria-describedby={`${id}-program-name-error`}
          value={programName}
          onChange={(event) => setProgramName(event.target.value)}
        />
        <FieldError
          id={`${id}-program-name-error`}
          errors={errors.programName}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-institution`}>Institución</Label>
        <Input
          id={`${id}-institution`}
          placeholder="Opcional"
          value={institution}
          onChange={(event) => setInstitution(event.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-effective-year`}>Vigente desde</Label>
          <Input
            id={`${id}-effective-year`}
            type="number"
            inputMode="numeric"
            placeholder="2026"
            required
            step={1}
            aria-invalid={errors.effectiveYear !== undefined}
            aria-describedby={`${id}-effective-year-error`}
            value={effectiveYear}
            onChange={(event) => setEffectiveYear(event.target.value)}
          />
          <FieldError
            id={`${id}-effective-year-error`}
            errors={errors.effectiveYear}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`${id}-version-name`}>Versión</Label>
          <Input
            id={`${id}-version-name`}
            placeholder="Opcional"
            value={versionName}
            onChange={(event) => setVersionName(event.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-term-system`}>Régimen</Label>
        <TermSystemSelect
          id={`${id}-term-system`}
          value={termSystem}
          onChange={setTermSystem}
        />
      </div>
      {children}
    </form>
  );
}
