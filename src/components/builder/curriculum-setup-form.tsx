"use client";

import { type ReactNode, useId, useState } from "react";
import { z } from "zod";
import { detailsSchema } from "@/builder/schemas";
import TermSystemSelect from "@/components/builder/term-system-select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { CurriculumDetails, TermSystem } from "@/types/builder";

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
  const [effectiveYear, setEffectiveYear] = useState(() =>
    String(new Date().getFullYear()),
  );
  const [termSystem, setTermSystem] = useState<TermSystem>("semester");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const result = detailsSchema.safeParse({
    programName,
    institution,
    effectiveYear: effectiveYear === "" ? undefined : Number(effectiveYear),
    versionName: "",
  });
  const errors =
    isSubmitted && !result.success
      ? z.flattenError(result.error).fieldErrors
      : {};

  return (
    <form
      noValidate
      className="flex flex-col gap-7"
      onSubmit={(event) => {
        event.preventDefault();
        setIsSubmitted(true);
        if (result.success) onSubmit(termSystem, result.data);
      }}
    >
      <FieldGroup className="gap-5">
        <Field
          className="gap-2"
          data-invalid={errors.programName !== undefined}
        >
          <FieldLabel htmlFor={`${id}-program-name`}>Programa</FieldLabel>
          <Input
            id={`${id}-program-name`}
            className="h-10"
            placeholder="Ej. Derecho"
            required
            autoFocus
            aria-invalid={errors.programName !== undefined}
            aria-describedby={`${id}-program-name-error`}
            value={programName}
            onChange={(event) => setProgramName(event.target.value)}
          />
          <FieldError
            id={`${id}-program-name-error`}
            errors={errors.programName?.map((message) => ({ message }))}
          />
        </Field>
        <Field
          className="gap-2"
          data-invalid={errors.institution !== undefined}
        >
          <FieldLabel htmlFor={`${id}-institution`}>Institución</FieldLabel>
          <Input
            id={`${id}-institution`}
            className="h-10"
            placeholder="Ej. Universidad de Chile"
            required
            aria-invalid={errors.institution !== undefined}
            aria-describedby={`${id}-institution-error`}
            value={institution}
            onChange={(event) => setInstitution(event.target.value)}
          />
          <FieldError
            id={`${id}-institution-error`}
            errors={errors.institution?.map((message) => ({ message }))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field
            className="gap-2"
            data-invalid={errors.effectiveYear !== undefined}
          >
            <FieldLabel htmlFor={`${id}-effective-year`}>
              Vigente desde
            </FieldLabel>
            <Input
              id={`${id}-effective-year`}
              className="h-10"
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
              errors={errors.effectiveYear?.map((message) => ({ message }))}
            />
          </Field>
          <Field className="gap-2">
            <FieldLabel htmlFor={`${id}-term-system`}>Régimen</FieldLabel>
            <TermSystemSelect
              id={`${id}-term-system`}
              className="h-10! w-full"
              value={termSystem}
              onChange={setTermSystem}
            />
          </Field>
        </div>
      </FieldGroup>
      {children}
    </form>
  );
}
