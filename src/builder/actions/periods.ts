import {
  createDraft,
  type Draft,
  type Handlers,
  type Period,
  type TermSystem,
} from "@/builder/draft";
import {
  canRemoveLastProgramYear,
  canRemovePeriod,
  comparePeriods,
  getAvailableIntensiveTerms,
  getLastProgramYear,
  isSamePeriod,
  REGULAR_TERMS,
} from "@/builder/periods";

export type PeriodAction =
  | { type: "createCurriculum"; termSystem: TermSystem }
  | { type: "setTermSystem"; termSystem: TermSystem }
  | { type: "addProgramYear" }
  | { type: "removeLastProgramYear" }
  | { type: "addIntensiveTerm"; programYear: number; term: number }
  | { type: "removePeriod"; period: Period };

function withPeriods(draft: Draft, periods: Period[]): Draft {
  return { ...draft, curriculum: { ...draft.curriculum, periods } };
}

export const periodHandlers: Handlers<PeriodAction> = {
  createCurriculum: (_, { termSystem }) => createDraft(termSystem),

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

  addProgramYear: (draft) => {
    const { periods, termSystem } = draft.curriculum;
    const programYear = getLastProgramYear(periods) + 1;
    return withPeriods(draft, [
      ...periods,
      ...REGULAR_TERMS[termSystem].map((term) => ({ programYear, term })),
    ]);
  },

  removeLastProgramYear: (draft) => {
    const { curriculum } = draft;
    if (!canRemoveLastProgramYear(curriculum)) return draft;
    const lastProgramYear = getLastProgramYear(curriculum.periods);
    return withPeriods(
      draft,
      curriculum.periods.filter(
        (period) => period.programYear !== lastProgramYear,
      ),
    );
  },

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
