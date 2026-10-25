"use client";

import { Plus } from "lucide-react";
import type { Action } from "@/builder/apply";
import { getCourseColor } from "@/builder/colors";
import type { Curriculum } from "@/builder/draft";
import { getCourseHeight, getDefaultCredits } from "@/builder/grid";
import { getPeriodLabel, isSamePeriod } from "@/builder/periods";
import CourseCard from "@/components/builder/course-card";
import { Button } from "@/components/ui/button";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
} from "@/utils/curriculum-grid";

const MIN_ROWS = 6;
const HEADER_ROWS = 1;

export default function CurriculumGrid({
  curriculum,
  dispatch,
  selectedCourseId,
  onSelectCourse,
}: {
  curriculum: Curriculum;
  dispatch: (action: Action) => void;
  selectedCourseId: number | null;
  onSelectCourse: (courseId: number) => void;
}) {
  const defaultCredits = getDefaultCredits(curriculum);

  const cards = curriculum.courses.flatMap((course) =>
    course.slots.map((slot, slotIndex) => ({
      key: `${course.id}/${slotIndex}`,
      course,
      column:
        curriculum.periods.findIndex((period) => isSamePeriod(period, slot)) +
        1,
      row: slot.position,
      height: getCourseHeight(course.credits, defaultCredits),
    })),
  );

  const rows = Math.max(
    MIN_ROWS,
    ...cards.map((card) => card.row + card.height - 1),
  );
  const footRow = HEADER_ROWS + rows + 1;

  return (
    <div
      className="grid w-max"
      style={{
        gridTemplateColumns: `repeat(${curriculum.periods.length}, ${GRID_CELL_WIDTH}rem)`,
        gridTemplateRows: `auto repeat(${rows}, ${GRID_CELL_HEIGHT}rem) auto`,
        gap: `${GRID_GAP}rem`,
      }}
    >
      {curriculum.periods.map((period, index) => (
        <h2
          key={`${period.programYear}-${period.term}`}
          className="text-balance text-center font-medium text-muted-foreground text-xs"
          style={{ gridColumn: index + 1, gridRow: 1 }}
        >
          {getPeriodLabel(curriculum.termSystem, period)}
        </h2>
      ))}
      {cards.map((card) => (
        <CourseCard
          key={card.key}
          course={card.course}
          color={getCourseColor(curriculum, card.course)}
          isSelected={card.course.id === selectedCourseId}
          onSelect={() => onSelectCourse(card.course.id)}
          style={{
            gridColumn: card.column,
            gridRow: `${HEADER_ROWS + card.row} / span ${card.height}`,
          }}
        />
      ))}
      {curriculum.periods.map((period, index) => (
        <Button
          key={`${period.programYear}-${period.term}`}
          variant="ghost"
          aria-label={`Agregar curso en ${getPeriodLabel(curriculum.termSystem, period)}`}
          style={{ gridColumn: index + 1, gridRow: footRow }}
          onClick={() => dispatch({ type: "addCourse", period })}
        >
          <Plus />
        </Button>
      ))}
    </div>
  );
}
