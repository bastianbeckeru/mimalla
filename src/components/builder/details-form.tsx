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
  dispatch: (action: Action) => void;
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
            dispatch({
              type: "editDetails",
              changes: { programName: event.target.value },
            })
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
            dispatch({
              type: "editDetails",
              changes: {
                effectiveYear:
                  event.target.value === "" ? null : Number(event.target.value),
              },
            })
          }
        />
      </div>
    </div>
  );
}
