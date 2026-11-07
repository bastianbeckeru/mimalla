"use client";

import { cn } from "cn";
import { Ellipsis, FolderPlus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Assessment } from "@/types/trajectory";
import { canPlace, convertToGroup, createSingle } from "@/utils/grading-scheme";

const BATCH_SIZES = [2, 3, 4, 5, 6, 7, 8];
const DROPPED_COUNTS = [0, 1, 2, 3];

export default function AssessmentMenu({
  assessment,
  assessments,
  triggerClassName,
  onUpdate,
  onAddBatch,
  onConvert,
  onRemove,
}: {
  assessment: Assessment;
  assessments: Assessment[];
  triggerClassName: string;
  onUpdate: (update: (assessment: Assessment) => Assessment) => void;
  onAddBatch: (count: number) => void;
  onConvert: () => void;
  onRemove: () => void;
}) {
  const canAddSingle =
    assessment.kind === "GROUP" &&
    canPlace(assessments, createSingle(), assessment.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Opciones de ${assessment.name}`}
            className={cn(
              "shrink-0 text-muted-foreground transition-opacity",
              triggerClassName,
            )}
          />
        }
      >
        <Ellipsis />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {assessment.kind === "SINGLE" ? (
          <DropdownMenuItem
            disabled={convertToGroup(assessments, assessment.id) === null}
            onClick={onConvert}
          >
            <FolderPlus />
            Convertir en grupo
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger disabled={!canAddSingle}>
                <Plus />
                Agregar varias
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {BATCH_SIZES.map((count) => (
                  <DropdownMenuItem
                    key={count}
                    onClick={() => onAddBatch(count)}
                  >
                    {count} evaluaciones
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                Descartar las peores notas
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuRadioGroup
                  value={assessment.droppedCount}
                  onValueChange={(droppedCount: number) =>
                    onUpdate((current) =>
                      current.kind === "GROUP"
                        ? { ...current, droppedCount }
                        : current,
                    )
                  }
                >
                  {DROPPED_COUNTS.map((count) => (
                    <DropdownMenuRadioItem key={count} value={count}>
                      {count === 0
                        ? "Ninguna"
                        : count === 1
                          ? "La peor"
                          : `Las ${count} peores`}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onRemove}>
          <Trash2 />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
