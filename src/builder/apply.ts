import { type AreaAction, areaHandlers } from "@/builder/actions/areas";
import { type CourseAction, courseHandlers } from "@/builder/actions/courses";
import {
  type CurriculumAction,
  curriculumHandlers,
} from "@/builder/actions/curriculum";
import {
  type ElectiveAction,
  electiveHandlers,
} from "@/builder/actions/electives";
import { type PeriodAction, periodHandlers } from "@/builder/actions/periods";
import { type SlotAction, slotHandlers } from "@/builder/actions/slots";
import type { Draft, Handlers } from "@/builder/draft";

export type Action =
  | CurriculumAction
  | CourseAction
  | AreaAction
  | PeriodAction
  | SlotAction
  | ElectiveAction;

const handlers: Handlers<Action> = {
  ...curriculumHandlers,
  ...courseHandlers,
  ...areaHandlers,
  ...periodHandlers,
  ...slotHandlers,
  ...electiveHandlers,
};

export function apply(draft: Draft, action: Action): Draft {
  const handle = handlers[action.type] as (
    draft: Draft,
    action: Action,
  ) => Draft;
  return handle(draft, action);
}
