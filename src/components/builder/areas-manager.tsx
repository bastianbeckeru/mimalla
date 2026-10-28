"use client";

import { Palette, Plus, Trash2 } from "lucide-react";
import { BASE_COLORS } from "@/builder/colors";
import AreaColorPicker from "@/components/builder/area-color-picker";
import ColorSwatch from "@/components/builder/color-swatch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Action, Draft } from "@/types/builder";

const NEW_AREA_NAME = "Nueva área";

export default function AreasManager({
  draft,
  dispatch,
}: {
  draft: Draft;
  dispatch: (action: Action) => void;
}) {
  const { areas } = draft.curriculum;

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <Palette />
            Áreas
          </Button>
        }
      />
      <PopoverContent
        side="top"
        align="end"
        sideOffset={8}
        className="w-80 gap-4"
      >
        <div className="flex flex-col gap-1.5">
          <span className="font-medium text-muted-foreground text-xs">
            Color base
          </span>
          <div className="flex flex-wrap gap-1.5">
            {BASE_COLORS.map((color) => (
              <ColorSwatch
                key={color}
                color={color}
                aria-label={`Usar ${color} como color base`}
                isSelected={color === draft.baseColor}
                onClick={() => dispatch({ type: "setBaseColor", color })}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-medium text-muted-foreground text-xs">
            Áreas
          </span>
          {areas.length === 0 && (
            <p className="text-muted-foreground text-xs">
              Agrupa cursos relacionados en áreas para darles un color.
            </p>
          )}
          {areas.map((area) => (
            <div key={area.id} className="flex items-center gap-2">
              <AreaColorPicker
                area={area}
                baseColor={draft.baseColor}
                dispatch={dispatch}
              />
              <Input
                aria-label="Nombre del área"
                value={area.name}
                onChange={(event) =>
                  dispatch({
                    type: "editArea",
                    areaId: area.id,
                    changes: { name: event.target.value },
                  })
                }
              />
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Eliminar ${area.name || "el área"}`}
                onClick={() =>
                  dispatch({ type: "deleteArea", areaId: area.id })
                }
              >
                <Trash2 />
              </Button>
            </div>
          ))}
          <Button
            variant="ghost"
            className="self-start"
            onClick={() => dispatch({ type: "addArea", name: NEW_AREA_NAME })}
          >
            <Plus />
            Agregar área
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
