"use client";

import { Plus, Search, TriangleAlert, X } from "lucide-react";
import { useState } from "react";
import { getPeriodTitle } from "@/builder/periods";
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
import type { Action, Course, Curriculum } from "@/types/builder";

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
  const [isCreditsRequested, setIsCreditsRequested] = useState(false);
  const isCreditsShown = isCreditsRequested || course.prerequisiteCredits > 0;
  const misplacedIds = getMisplacedPrerequisiteIds(curriculum, course.id);
  const prerequisites = curriculum.courses.filter((candidate) =>
    course.prerequisiteIds.includes(candidate.id),
  );
  const candidates = curriculum.courses.filter(
    (candidate) =>
      candidate.id !== course.id &&
      !course.prerequisiteIds.includes(candidate.id),
  );

  function getAreaColor(prerequisite: Course) {
    return curriculum.areas.find((area) => area.id === prerequisite.areaId)
      ?.color;
  }

  function describe(candidate: Course) {
    const [firstSlot] = candidate.slots;
    const period =
      firstSlot && getPeriodTitle(curriculum.termSystem, firstSlot);
    return [candidate.code, period].filter(Boolean).join(" · ");
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-sm">Prerrequisitos</h3>
        {prerequisites.length > 0 && (
          <span className="text-muted-foreground text-xs tabular-nums">
            {prerequisites.length}
          </span>
        )}
      </div>
      {prerequisites.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {prerequisites.map((prerequisite) => {
            const [firstSlot] = prerequisite.slots;
            return (
              <li
                key={prerequisite.id}
                className="flex items-stretch gap-3 rounded-lg bg-muted/50 py-2 pr-1.5 pl-3"
              >
                <span
                  className="w-0.5 shrink-0 rounded-full bg-muted-foreground/40"
                  style={{ backgroundColor: getAreaColor(prerequisite) }}
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-sm">
                    {prerequisite.name}
                  </span>
                  {misplacedIds.includes(prerequisite.id) ? (
                    <span className="flex items-center gap-1 text-warning text-xs">
                      <TriangleAlert className="size-3 shrink-0" />
                      Está en la misma columna o en una posterior.
                    </span>
                  ) : (
                    firstSlot && (
                      <span className="text-muted-foreground text-xs">
                        {getPeriodTitle(curriculum.termSystem, firstSlot)}
                      </span>
                    )
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`Quitar prerrequisito ${prerequisite.name}`}
                  className="self-center text-muted-foreground"
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
              </li>
            );
          })}
        </ul>
      )}
      <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className="justify-start font-normal text-muted-foreground"
            />
          }
        >
          <Search />
          Buscar curso...
        </PopoverTrigger>
        <PopoverContent className="w-(--anchor-width) p-0" align="start">
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
      {isCreditsShown ? (
        <div className="flex flex-col gap-1.5 pt-1">
          <Label htmlFor="builder-course-prerequisite-credits">
            Créditos aprobados mínimos
          </Label>
          <Input
            id="builder-course-prerequisite-credits"
            inputMode="numeric"
            autoFocus={course.prerequisiteCredits === 0}
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
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2.5 self-start text-muted-foreground"
          onClick={() => setIsCreditsRequested(true)}
        >
          <Plus />
          Exigir créditos aprobados
        </Button>
      )}
    </div>
  );
}
