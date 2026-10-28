"use client";

import { ChevronDown, Coins, Layers, Lock, Slash } from "lucide-react";
import { detailsSchema } from "@/builder/schemas";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { Action, Curriculum, TermSystem } from "@/types/builder";

const TERM_SYSTEMS: { value: TermSystem; label: string }[] = [
  { value: "semester", label: "Semestral" },
  { value: "annual", label: "Anual" },
];

export function OptionalLabel({
  htmlFor,
  children,
}: {
  htmlFor: string;
  children: string;
}) {
  return (
    <FieldLabel htmlFor={htmlFor} className="w-full justify-between">
      {children}
      <span className="font-normal text-muted-foreground text-xs">
        Opcional
      </span>
    </FieldLabel>
  );
}

export default function DetailsForm({
  curriculum,
  dispatch,
  open,
  onOpenChange,
}: {
  curriculum: Curriculum;
  dispatch: (action: Action, options?: { group?: string }) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { programName, institution, effectiveYear } = detailsSchema.shape;
  const hasCourses = curriculum.courses.length > 0;
  const credits = curriculum.courses.reduce(
    (total, course) => total + course.credits,
    0,
  );

  function edit(
    changes: Partial<Curriculum>,
    group: "program-name" | "institution" | "effective-year" | "version-name",
  ) {
    dispatch({ type: "editDetails", changes }, { group });
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            className="h-9 min-w-0 gap-2.5 px-2 text-base aria-expanded:bg-muted"
          />
        }
      >
        {curriculum.institution !== "" && (
          <>
            <span className="truncate font-heading font-medium text-muted-foreground">
              {curriculum.institution}
            </span>
            <Slash className="size-3 rotate-[-22.5deg] text-muted-foreground/60" />
          </>
        )}
        <span className="truncate font-heading font-medium">
          {curriculum.programName || "Sin título"}
        </span>
        <ChevronDown className="text-muted-foreground transition-transform duration-200 group-aria-expanded/button:rotate-180" />
      </PopoverTrigger>
      <PopoverContent align="start" sideOffset={8} className="w-100 gap-0 p-0">
        <div className="flex flex-col gap-0.5 px-5 pt-5">
          <h2 className="font-heading font-semibold text-base">
            Detalles de la malla
          </h2>
          <p className="text-muted-foreground text-xs">
            Así aparecerá la malla al descargarla o compartirla.
          </p>
        </div>
        <FieldGroup className="gap-4 p-5">
          <Field className="gap-2">
            <FieldLabel htmlFor="builder-program-name">Programa</FieldLabel>
            <Input
              id="builder-program-name"
              placeholder="Ej. Derecho"
              required
              aria-invalid={
                !programName.safeParse(curriculum.programName).success
              }
              value={curriculum.programName}
              onChange={(event) =>
                edit({ programName: event.target.value }, "program-name")
              }
            />
          </Field>
          <Field className="gap-2">
            <FieldLabel htmlFor="builder-institution">Institución</FieldLabel>
            <Input
              id="builder-institution"
              placeholder="Ej. Universidad de Chile"
              required
              aria-invalid={
                !institution.safeParse(curriculum.institution).success
              }
              value={curriculum.institution}
              onChange={(event) =>
                edit({ institution: event.target.value }, "institution")
              }
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field className="gap-2">
              <FieldLabel htmlFor="builder-effective-year">
                Vigente desde
              </FieldLabel>
              <Input
                id="builder-effective-year"
                type="number"
                inputMode="numeric"
                placeholder="2026"
                required
                min={1900}
                max={2100}
                step={1}
                aria-invalid={
                  !effectiveYear.safeParse(curriculum.effectiveYear).success
                }
                value={curriculum.effectiveYear ?? ""}
                onChange={(event) =>
                  edit(
                    {
                      effectiveYear:
                        event.target.value === ""
                          ? null
                          : Number(event.target.value),
                    },
                    "effective-year",
                  )
                }
              />
            </Field>
            <Field className="gap-2">
              <OptionalLabel htmlFor="builder-version-name">
                Versión
              </OptionalLabel>
              <Input
                id="builder-version-name"
                placeholder="v6.0"
                value={curriculum.versionName}
                onChange={(event) =>
                  edit({ versionName: event.target.value }, "version-name")
                }
              />
            </Field>
          </div>
          <Field className="gap-2" data-disabled={hasCourses}>
            <FieldLabel id="builder-term-system">Régimen</FieldLabel>
            <ToggleGroup
              aria-labelledby="builder-term-system"
              spacing={0}
              className="grid w-full grid-cols-2 gap-0.5 rounded-lg bg-muted/50 p-0.5 ring-1 ring-border"
              value={[curriculum.termSystem]}
              disabled={hasCourses}
              onValueChange={([termSystem]) => {
                if (termSystem)
                  dispatch({
                    type: "setTermSystem",
                    termSystem: termSystem as TermSystem,
                  });
              }}
            >
              {TERM_SYSTEMS.map((termSystem) => (
                <ToggleGroupItem
                  key={termSystem.value}
                  value={termSystem.value}
                  size="sm"
                  className="rounded-md! font-normal text-muted-foreground aria-pressed:bg-popover aria-pressed:text-foreground aria-pressed:shadow-xs dark:aria-pressed:bg-muted"
                >
                  {termSystem.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {hasCourses && (
              <FieldDescription className="flex items-center gap-1.5 text-xs">
                <Lock className="size-3" />
                La malla ya tiene cursos.
              </FieldDescription>
            )}
          </Field>
        </FieldGroup>
        <div className="flex items-center gap-5 border-t px-5 py-3.5 text-muted-foreground text-sm">
          <span className="flex items-center gap-2">
            <Layers className="size-4" />
            <span className="font-medium text-foreground tabular-nums">
              {curriculum.courses.length}
            </span>
            cursos
          </span>
          <span className="flex items-center gap-2">
            <Coins className="size-4" />
            <span className="font-medium text-foreground tabular-nums">
              {credits}
            </span>
            créditos
          </span>
        </div>
      </PopoverContent>
    </Popover>
  );
}
