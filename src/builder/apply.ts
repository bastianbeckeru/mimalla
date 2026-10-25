import { type AreaAction, areaHandlers } from "@/builder/actions/areas";
import { type CourseAction, courseHandlers } from "@/builder/actions/courses";
import {
  type CurriculumAction,
  curriculumHandlers,
} from "@/builder/actions/curriculum";
import { type PeriodAction, periodHandlers } from "@/builder/actions/periods";
import type { Draft, Handlers } from "@/builder/draft";

export type Action =
  | CurriculumAction
  | CourseAction
  | AreaAction
  | PeriodAction;

const handlers: Handlers<Action> = {
  ...curriculumHandlers,
  ...courseHandlers,
  ...areaHandlers,
  ...periodHandlers,
};

export function apply(draft: Draft, action: Action): Draft {
  const handle = handlers[action.type] as (
    draft: Draft,
    action: Action,
  ) => Draft;
  return handle(draft, action);
}
