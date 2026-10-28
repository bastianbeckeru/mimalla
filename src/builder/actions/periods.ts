import { createDraft } from "@/builder/draft";
import {
  canRemovePeriod,
  comparePeriods,
  getAvailableIntensiveTerms,
  isSamePeriod,
  REGULAR_TERMS,
} from "@/builder/periods";
import type {
  Curriculum,
  Draft,
  Handlers,
  Period,
  PeriodAction,
} from "@/types/builder";

function withPeriods(draft: Draft, periods: Period[]): Draft {
  return { ...draft, curriculum: { ...draft.curriculum, periods } };
}

function getNextRegularPeriod({ termSystem, periods }: Curriculum): Period {
  const [firstTerm = 1, ...laterTerms] = REGULAR_TERMS[termSystem];
  const last = periods.toSorted(comparePeriods).at(-1);
  if (!last) return { programYear: 1, term: firstTerm };
  const term = laterTerms.find((candidate) => candidate > last.term);
  return term === undefined
    ? { programYear: last.programYear + 1, term: firstTerm }
    : { programYear: last.programYear, term };
}

export const periodHandlers: Handlers<PeriodAction> = {
  createCurriculum: (_, { termSystem, details }) => {
    const draft = createDraft(termSystem);
    return { ...draft, curriculum: { ...draft.curriculum, ...details } };
  },

  setTermSystem: (draft, { termSystem }) => {
    const { curriculum } = draft;
    if (curriculum.termSystem === termSystem || curriculum.courses.length > 0)
      return draft;
    const programYears = new Set(
      curriculum.periods.map((period) => period.programYear),
    );
    return {
      ...draft,
      curriculum: {
        ...curriculum,
        termSystem,
        periods: [...programYears].flatMap((programYear) =>
          REGULAR_TERMS[termSystem].map((term) => ({ programYear, term })),
        ),
      },
    };
  },

  addPeriod: (draft) =>
    withPeriods(draft, [
      ...draft.curriculum.periods,
      getNextRegularPeriod(draft.curriculum),
    ]),

  addIntensiveTerm: (draft, { programYear, term }) => {
    const { curriculum } = draft;
    if (!getAvailableIntensiveTerms(curriculum, programYear).includes(term))
      return draft;
    return withPeriods(
      draft,
      [...curriculum.periods, { programYear, term }].toSorted(comparePeriods),
    );
  },

  removePeriod: (draft, { period }) => {
    const { curriculum } = draft;
    if (!canRemovePeriod(curriculum, period)) return draft;
    return withPeriods(
      draft,
      curriculum.periods.filter(
        (candidate) => !isSamePeriod(candidate, period),
      ),
    );
  },
};
