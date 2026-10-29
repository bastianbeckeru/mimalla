"use client";

import type { Area } from "@/types/builder";

export default function AreasLegend({ areas }: { areas: Area[] }) {
  return (
    <ul
      className="no-scrollbar scroll-fade-x flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain"
      onWheel={(event) => {
        if (Math.abs(event.deltaY) > Math.abs(event.deltaX))
          event.currentTarget.scrollLeft += event.deltaY;
      }}
    >
      {areas.map((area) => (
        <li
          key={area.id}
          className="flex h-7 shrink-0 items-center gap-2 rounded-full border px-2.5 text-muted-foreground text-xs"
        >
          <AreaSwatch color={area.color} />
          <span className="max-w-48 truncate">{area.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function AreaSwatch({ color }: { color: string | undefined }) {
  return (
    <span
      aria-hidden
      className="size-2.5 shrink-0 rounded-[3px] bg-muted ring-1 ring-foreground/15"
      style={color ? { backgroundColor: color } : undefined}
    />
  );
}
