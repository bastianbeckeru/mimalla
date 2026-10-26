"use client";

import { useState } from "react";
import { BASE_COLORS, getAreaShades, isHexColor } from "@/builder/colors";
import ColorSwatch from "@/components/builder/color-swatch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Action, Area } from "@/types/builder";
import type { HexColor } from "@/types/colors";

export default function AreaColorPicker({
  area,
  baseColor,
  dispatch,
}: {
  area: Area;
  baseColor: HexColor;
  dispatch: (action: Action) => void;
}) {
  const [hexText, setHexText] = useState<string>(area.color);
  const hexInputId = `builder-area-${area.id}-hex`;

  function setColor(color: HexColor) {
    setHexText(color);
    dispatch({ type: "setAreaColor", areaId: area.id, color });
  }

  return (
    <Popover onOpenChange={(open) => open && setHexText(area.color)}>
      <PopoverTrigger
        render={
          <ColorSwatch
            color={area.color}
            aria-label={`Cambiar el color de ${area.name || "el área"}`}
          />
        }
      />
      <PopoverContent align="start" className="w-64">
        <ColorGroup
          label="Tonos del color base"
          colors={getAreaShades(baseColor)}
          selectedColor={area.color}
          onSelect={setColor}
        />
        <ColorGroup
          label="Otros colores"
          colors={BASE_COLORS}
          selectedColor={area.color}
          onSelect={setColor}
        />
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={hexInputId}>Hex</Label>
          <Input
            id={hexInputId}
            className="font-mono"
            placeholder="#4f46e5"
            maxLength={7}
            aria-invalid={!isHexColor(hexText)}
            value={hexText}
            onChange={(event) => {
              const text = event.target.value.trim();
              setHexText(text);
              if (isHexColor(text))
                dispatch({
                  type: "setAreaColor",
                  areaId: area.id,
                  color: text,
                });
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ColorGroup({
  label,
  colors,
  selectedColor,
  onSelect,
}: {
  label: string;
  colors: readonly HexColor[];
  selectedColor: string;
  onSelect: (color: HexColor) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-medium text-muted-foreground text-xs">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {colors.map((color) => (
          <ColorSwatch
            key={color}
            color={color}
            aria-label={color}
            isSelected={color === selectedColor}
            onClick={() => onSelect(color)}
          />
        ))}
      </div>
    </div>
  );
}
