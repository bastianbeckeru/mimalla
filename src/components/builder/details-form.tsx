"use client";

import type { Action } from "@/builder/apply";
import type { Curriculum } from "@/builder/draft";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function DetailsForm({
  curriculum,
  dispatch,
}: {
  curriculum: Curriculum;
  dispatch: (action: Action, options?: { group?: string }) => void;
}) {
  return (
    <div className="flex items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="builder-program-name">Programa</Label>
        <Input
          id="builder-program-name"
          className="w-64"
          placeholder="Derecho"
          required
          value={curriculum.programName}
          onChange={(event) =>
            dispatch(
              {
                type: "editDetails",
                changes: { programName: event.target.value },
              },
              { group: "program-name" },
            )
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="builder-institution">Institución</Label>
        <Input
          id="builder-institution"
          className="w-40"
          placeholder="Opcional"
          value={curriculum.institution}
          onChange={(event) =>
            dispatch(
              {
                type: "editDetails",
                changes: { institution: event.target.value },
              },
              { group: "institution" },
            )
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="builder-effective-year">Vigente desde</Label>
        <Input
          id="builder-effective-year"
          className="w-28"
          type="number"
          inputMode="numeric"
          placeholder="2026"
          required
          min={1900}
          max={2100}
          step={1}
          value={curriculum.effectiveYear ?? ""}
          onChange={(event) =>
            dispatch(
              {
                type: "editDetails",
                changes: {
                  effectiveYear:
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                },
              },
              { group: "effective-year" },
            )
          }
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="builder-version-name">Versión</Label>
        <Input
          id="builder-version-name"
          className="w-32"
          placeholder="v6.0"
          value={curriculum.versionName}
          onChange={(event) =>
            dispatch(
              {
                type: "editDetails",
                changes: { versionName: event.target.value },
              },
              { group: "version-name" },
            )
          }
        />
      </div>
    </div>
  );
}
