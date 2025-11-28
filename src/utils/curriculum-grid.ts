import type {
  CurriculumData,
  PeriodKey,
  Slot,
  Course,
  ExtendedSlot,
} from '@/types/curriculum';
import { getCourse, getCourseArea } from './curriculum';
import { calculateMedian } from './numbers';

export const GRID_CELL_WIDTH = 8;
export const GRID_CELL_HEIGHT = 4;
export const GRID_GAP = 0.5;
export const GRID_MARGIN = 0.25;
export const PADDING = 0.5;
export const FONTSIZE = 16; // px

// COURSE FUNCTIONS
export function getPosition(periods: PeriodKey[], slot: Slot) {
  const x = periods.findIndex((pKey) => pKey === `${slot.year}-${slot.term}`); // Start from 0
  const y = slot.position; // Start from 1

  return { x: x + 1, y: y };
}

export function getCurriculumGridData(data: CurriculumData) {
  const { periods, nCols, nRows } = getPeriods({
    slots: data.curriculum.structure,
  });

  const creditsMedian = calculateMedian(data.courses.map((c) => c.credits));
  const courses = new Map(data.courses.map((item) => [item.id, item]));

  const serializedSlots = data.curriculum.structure.map((slot) => {
    const position = getPosition(periods, slot);
    const course = getCourse({ id: slot.courseId, courses });
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
      color: area?.color ?? '#fafafa',
      course: course ? { ...course, areaId: area?.id ?? null } : null,
    };
  });

  const fixedSlots = resolveGridCollisions(serializedSlots);

  return {
    courses,
    periods,
    nCols,
    nRows,
    slots: fixedSlots,
  };
}

export function getMostFrequentCredits(courses: Course[]): number {
  if (courses.length === 0) return 0;

  const frequencyMap = new Map<number, number>();

  courses.forEach((course) => {
    const count = frequencyMap.get(course.credits) || 0;
    frequencyMap.set(course.credits, count + 1);
  });

  let maxFrequency = 0;
  let mode = 0;

  frequencyMap.forEach((frequency, credit) => {
    if (frequency > maxFrequency) {
      maxFrequency = frequency;
      mode = credit;
    }
  });

  return mode;
}

function getPeriods({ slots }: { slots: Slot[] }): {
  nCols: number;
  nRows: number;
  periods: PeriodKey[];
} {
  const uniquePeriods = new Set<PeriodKey>(
    slots.map((s) => `${s.year}-${s.term}` as PeriodKey)
  );

  const sortedPeriods = Array.from(uniquePeriods).sort((a, b) => {
    const [yearA, termA] = a.split('-').map(Number);
    const [yearB, termB] = b.split('-').map(Number);

    return yearA! - yearB! || termA! - termB!;
  });

  const nCols = sortedPeriods.length;
  const nRows = Math.max(1, ...slots.map((s) => s.position));

  return { periods: sortedPeriods, nCols, nRows };
}

function resolveGridCollisions(elements: ExtendedSlot[]) {
  // Clonar para no mutar el array original
  const items = elements.map((item) => ({ ...item }));

  // Ordenar por posición (arriba-izquierda primero)
  items.sort((a, b) => a.y - b.y || a.x - b.x);

  // Mapa de celdas ocupadas: "x,y" -> true
  const occupied = new Map();

  // Marcar celdas como ocupadas
  function markOccupied(x: number, y: number, w: number, h: number) {
    for (let row = y; row < y + h; row++) {
      for (let col = x; col < x + w; col++) {
        occupied.set(`${col},${row}`, true);
      }
    }
  }

  // Verificar si una posición está libre
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

  // Buscar la siguiente posición libre (solo hacia abajo, manteniendo x)
  function findNextFreeY(x: number, startY: number, w: number, h: number) {
    let y = startY;

    while (!isAreaFree(x, y, w, h)) {
      y++;
    }

    return y;
  }

  // Procesar cada elemento
  const resolved = items.map((item) => {
    const { x, y, w, h } = item;

    // Buscar primera Y libre manteniendo X fija
    const newY = findNextFreeY(x, y, w, h);

    // Marcar celdas como ocupadas
    markOccupied(x, newY, w, h);

    return {
      ...item,
      x: x, // X nunca cambia
      y: newY, // Solo Y puede cambiar
    };
  });

  return resolved;
}
