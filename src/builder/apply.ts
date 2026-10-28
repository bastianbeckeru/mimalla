import { areaHandlers } from "@/builder/actions/areas";
import { courseHandlers } from "@/builder/actions/courses";
import { curriculumHandlers } from "@/builder/actions/curriculum";
import { electiveHandlers } from "@/builder/actions/electives";
import { periodHandlers } from "@/builder/actions/periods";
import { prerequisiteHandlers } from "@/builder/actions/prerequisites";
import { resizeHandlers } from "@/builder/actions/resize";
import { slotHandlers } from "@/builder/actions/slots";
import { trackHandlers } from "@/builder/actions/tracks";
import { pushDownCollisions } from "@/builder/grid";
import type { Action, Draft, Handlers } from "@/types/builder";

const handlers: Handlers<Action> = {
  ...curriculumHandlers,
  ...courseHandlers,
  ...areaHandlers,
  ...trackHandlers,
  ...periodHandlers,
  ...slotHandlers,
  ...resizeHandlers,
  ...electiveHandlers,
  ...prerequisiteHandlers,
};

export function apply(draft: Draft, action: Action): Draft {
  const handle = handlers[action.type] as (
    draft: Draft,
    action: Action,
  ) => Draft;
  const next = handle(draft, action);
  if (next === draft) return draft;
  const curriculum = pushDownCollisions(next.curriculum);
  return curriculum === next.curriculum ? next : { ...next, curriculum };
}
