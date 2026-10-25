import { type CourseAction, courseHandlers } from "@/builder/actions/courses";
import {
  type CurriculumAction,
  curriculumHandlers,
} from "@/builder/actions/curriculum";
import type { Draft, Handlers } from "@/builder/draft";

export type Action = CurriculumAction | CourseAction;

const handlers: Handlers<Action> = {
  ...curriculumHandlers,
  ...courseHandlers,
};

export function apply(draft: Draft, action: Action): Draft {
  const handle = handlers[action.type] as (
    draft: Draft,
    action: Action,
  ) => Draft;
  return handle(draft, action);
}
