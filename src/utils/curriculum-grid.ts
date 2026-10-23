import type {
  CurriculumData,
  ExtendedSlot,
  PeriodKey,
  Slot,
} from "@/types/curriculum";
import { DEFAULT_COURSE_COLOR } from "@/utils/colors";
import { extendCourses, getCourseArea, getPeriods } from "@/utils/curriculum";
import { calculateMedian } from "@/utils/numbers";

export const GRID_CELL_WIDTH = 8;
export const GRID_CELL_HEIGHT = 4;
export const GRID_GAP = 0.5;
export const PADDING = 0.5;
export const FONTSIZE = 16;

function getPosition(periods: PeriodKey[], slot: Slot) {
  return {
    x: periods.indexOf(`${slot.programYear}-${slot.term}`) + 1,
    y: slot.position,
  };
}

export function getCurriculumGridData(data: CurriculumData) {
  const { periods, nCols, nRows } = getPeriods(data.curriculum.slots);

  const creditsMedian = calculateMedian(data.courses.map((c) => c.credits));
  const courses = extendCourses(data.courses);

  const serializedSlots = data.curriculum.slots.map((slot) => {
    const position = getPosition(periods, slot);
    const course = courses.get(slot.courseId) ?? null;
    const area = course ? getCourseArea(data.areas, course) : null;

    const calculateHeight = () => {
      if (!course || course.credits <= 0 || creditsMedian <= 0) return 1;

      const ratio = Math.trunc(course.credits / creditsMedian);
      return Math.max(ratio, 1);
    };

    return {
      ...slot,
      x: position.x,
      y: position.y,
      w: course?.duration ?? 1,
      h: calculateHeight(),
      color: area?.color ?? DEFAULT_COURSE_COLOR,
      course,
    };
  });

  const slots = resolveGridCollisions(serializedSlots);

  return {
    courses,
    periods,
    nCols,
    nRows: Math.max(nRows, ...slots.map((s) => s.y + s.h - 1)),
    slots,
  };
}

function resolveGridCollisions(elements: ExtendedSlot[]) {
  const items = [...elements].sort((a, b) => a.y - b.y || a.x - b.x);

  const occupied = new Set<string>();

  function markOccupied(x: number, y: number, w: number, h: number) {
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        occupied.add(`${col},${row}`);
      }
    }
  }

  function isAreaFree(x: number, y: number, w: number, h: number) {
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        if (occupied.has(`${col},${row}`)) {
          return false;
        }
      }
    }
    return true;
  }

  function findNextFreeY(x: number, startY: number, w: number, h: number) {
    let y = startY;

    while (!isAreaFree(x, y, w, h)) {
      y++;
    }

    return y;
  }

  return items.map((item) => {
    const { x, y, w, h } = item;
    const newY = findNextFreeY(x, y, w, h);

    markOccupied(x, newY, w, h);

    return { ...item, y: newY };
  });
}
