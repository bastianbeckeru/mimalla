"use client";

import { Plus, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import type { Action } from "@/builder/apply";
import type { Course, Curriculum } from "@/builder/draft";
import { getPeriodLabel } from "@/builder/periods";
import {
  canAddPrerequisite,
  getMisplacedPrerequisiteIds,
} from "@/builder/prerequisites";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const CREDITS_PATTERN = /^\d+$/;

export default function PrerequisitesField({
  curriculum,
  course,
  dispatch,
}: {
  curriculum: Curriculum;
  course: Course;
  dispatch: (action: Action, options?: { group?: string }) => void;
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [creditsText, setCreditsText] = useState(
    String(course.prerequisiteCredits),
  );
  const [prevCredits, setPrevCredits] = useState(course.prerequisiteCredits);
  if (course.prerequisiteCredits !== prevCredits) {
    setPrevCredits(course.prerequisiteCredits);
    setCreditsText(String(course.prerequisiteCredits));
  }
  const hasValidCredits = CREDITS_PATTERN.test(creditsText);
  const misplacedIds = getMisplacedPrerequisiteIds(curriculum, course.id);
  const prerequisites = curriculum.courses.filter((candidate) =>
    course.prerequisiteIds.includes(candidate.id),
  );
  const candidates = curriculum.courses.filter(
    (candidate) =>
      candidate.id !== course.id &&
      !course.prerequisiteIds.includes(candidate.id),
  );

  function describe(candidate: Course) {
    const [firstSlot] = candidate.slots;
    const period =
      firstSlot && getPeriodLabel(curriculum.termSystem, firstSlot);
    return [candidate.code, period].filter(Boolean).join(" · ");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="font-medium text-sm">Prerrequisitos</span>
        {prerequisites.length > 0 && (
          <ul className="flex flex-col gap-1">
            {prerequisites.map((prerequisite) => (
              <li key={prerequisite.id} className="flex flex-col text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{prerequisite.name}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Quitar prerrequisito ${prerequisite.name}`}
                    onClick={() =>
                      dispatch({
                        type: "removePrerequisite",
                        courseId: course.id,
                        prerequisiteId: prerequisite.id,
                      })
                    }
                  >
                    <X />
                  </Button>
                </div>
                {misplacedIds.includes(prerequisite.id) && (
                  <p className="flex items-center gap-1 text-warning text-xs">
                    <TriangleAlert className="size-3 shrink-0" />
                    Está en la misma columna que este curso o en una posterior.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <PopoverTrigger
            render={<Button variant="outline" className="justify-start" />}
          >
            <Plus />
            Agregar prerrequisito
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar curso..." />
              <CommandList>
                <CommandEmpty>No hay otros cursos.</CommandEmpty>
                {candidates.map((candidate) => {
                  const isAllowed = canAddPrerequisite(
                    curriculum,
                    course.id,
                    candidate.id,
                  );
                  return (
                    <CommandItem
                      key={candidate.id}
                      value={String(candidate.id)}
                      keywords={[candidate.name, candidate.code]}
                      disabled={!isAllowed}
                      onSelect={() => {
                        dispatch({
                          type: "addPrerequisite",
                          courseId: course.id,
                          prerequisiteId: candidate.id,
                        });
                        setIsSearchOpen(false);
                      }}
                    >
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate">{candidate.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {isAllowed
                            ? describe(candidate)
                            : "Crearía un ciclo de prerrequisitos"}
                        </span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="builder-course-prerequisite-credits">
          Créditos aprobados mínimos
        </Label>
        <Input
          id="builder-course-prerequisite-credits"
          inputMode="numeric"
          aria-invalid={!hasValidCredits}
          aria-describedby="builder-course-prerequisite-credits-error"
          value={creditsText}
          onChange={(event) => {
            const text = event.target.value.trim();
            setCreditsText(text);
            if (CREDITS_PATTERN.test(text))
              dispatch(
                {
                  type: "setPrerequisiteCredits",
                  courseId: course.id,
                  credits: Number(text),
                },
                { group: `course-${course.id}-prerequisite-credits` },
              );
          }}
        />
        {!hasValidCredits && (
          <p
            id="builder-course-prerequisite-credits-error"
            className="text-destructive text-xs"
          >
            Los créditos deben ser un número entero mayor o igual a 0.
          </p>
        )}
      </div>
    </div>
  );
}
