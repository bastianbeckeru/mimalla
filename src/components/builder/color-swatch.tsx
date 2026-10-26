"use client";

import { cn } from "cn";
import { Check } from "lucide-react";
import type { ComponentProps } from "react";
import { getTextColor } from "@/builder/colors";
import type { HexColor } from "@/types/colors";

export default function ColorSwatch({
  color,
  isSelected = false,
  className,
  ...props
}: ComponentProps<"button"> & { color: HexColor; isSelected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md ring-1 ring-foreground/15 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      style={{ backgroundColor: color, color: getTextColor(color) }}
      {...props}
    >
      {isSelected && <Check className="size-3.5" />}
    </button>
  );
}
