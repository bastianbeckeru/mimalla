import AreasManager from "@/components/builder/areas-manager";
import type { Action, Draft } from "@/types/builder";

export default function AreasBar({
  draft,
  dispatch,
}: {
  draft: Draft;
  dispatch: (action: Action) => void;
}) {
  return (
    <footer className="flex shrink-0 items-center gap-4 px-6 py-3">
      <ul
        className="no-scrollbar scroll-fade-x flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-x-contain"
        onWheel={(event) => {
          if (Math.abs(event.deltaY) > Math.abs(event.deltaX))
            event.currentTarget.scrollLeft += event.deltaY;
        }}
      >
        {draft.curriculum.areas.map((area) => (
          <li
            key={area.id}
            className="flex h-7 shrink-0 items-center gap-2 rounded-full border px-2.5 text-muted-foreground text-xs"
          >
            <span
              className="size-2.5 shrink-0 rounded-[3px] ring-1 ring-foreground/15"
              style={{ backgroundColor: area.color }}
            />
            <span className="max-w-48 truncate">{area.name}</span>
          </li>
        ))}
      </ul>
      <AreasManager draft={draft} dispatch={dispatch} />
    </footer>
  );
}
