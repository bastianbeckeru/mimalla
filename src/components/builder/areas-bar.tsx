import AreasManager from "@/components/builder/areas-manager";
import TracksManager from "@/components/builder/tracks-manager";
import AreasLegend from "@/components/curriculum/areas-legend";
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
      <AreasLegend areas={draft.curriculum.areas} />
      <div className="flex shrink-0 items-center gap-1">
        <TracksManager draft={draft} dispatch={dispatch} />
        <AreasManager draft={draft} dispatch={dispatch} />
      </div>
    </footer>
  );
}
