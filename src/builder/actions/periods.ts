import {
  createDraft,
  type Draft,
  type Handlers,
  type Period,
  type TermSystem,
} from "@/builder/draft";
import {
  canRemovePeriod,
  comparePeriods,
  getAvailableIntensiveTerms,
  isPeriodOccupied,
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

function getLastProgramYear(periods: Period[]) {
  return Math.max(0, ...periods.map((period) => period.programYear));
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
    const lastProgramYear = getLastProgramYear(curriculum.periods);
    const isInLastYear = (period: Period) =>
      period.programYear === lastProgramYear;
    const kept = curriculum.periods.filter((period) => !isInLastYear(period));
    const isLastYearOccupied = curriculum.periods
      .filter(isInLastYear)
      .some((period) => isPeriodOccupied(curriculum, period));
    if (kept.length === 0 || isLastYearOccupied) return draft;
    return withPeriods(draft, kept);
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
