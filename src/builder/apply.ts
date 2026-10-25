import { type CourseAction, courseHandlers } from "@/builder/actions/courses";
import {
  type CurriculumAction,
  curriculumHandlers,
} from "@/builder/actions/curriculum";
import { type SlotAction, slotHandlers } from "@/builder/actions/slots";
import type { Draft, Handlers } from "@/builder/draft";

export type Action = CurriculumAction | CourseAction | SlotAction;

const handlers: Handlers<Action> = {
  ...curriculumHandlers,
  ...courseHandlers,
  ...slotHandlers,
};

export function apply(draft: Draft, action: Action): Draft {
  const handle = handlers[action.type] as (
    draft: Draft,
    action: Action,
  ) => Draft;
  return handle(draft, action);
}
