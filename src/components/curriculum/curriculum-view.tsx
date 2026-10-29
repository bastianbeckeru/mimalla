"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { useState } from "react";
import { getCourseColor } from "@/builder/colors";
import { getCourseCards } from "@/builder/grid";
import { getPeriodLabel } from "@/builder/periods";
import AreasLegend from "@/components/curriculum/areas-legend";
import ConnectionsOverlay from "@/components/curriculum/connections-overlay";
import CourseCard from "@/components/curriculum/course-card";
import type { Curriculum } from "@/types/builder";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
} from "@/utils/curriculum-grid";

const HEADER_ROWS = 1;

export default function CurriculumView({
  curriculum,
}: {
  curriculum: Curriculum;
}) {
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const cards = getCourseCards(curriculum);
  const columns = curriculum.periods.length;
  const rows = Math.max(1, ...cards.map((card) => card.row + card.height - 1));

  useHotkey("Escape", () => setSelectedCourseId(null), {
    enabled: selectedCourseId !== null,
  });

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <section
        aria-label="Malla curricular"
        className="flex-1 overflow-auto px-4 pt-4 pb-2 lg:px-8"
      >
        <div
          className="relative grid w-max"
          style={{
            gridTemplateColumns: `repeat(${columns}, ${GRID_CELL_WIDTH}rem)`,
            gridTemplateRows: `auto repeat(${rows}, ${GRID_CELL_HEIGHT}rem)`,
            gap: `${GRID_GAP}rem`,
          }}
        >
          {curriculum.periods.map((period, index) => (
            <h2
              key={`${period.programYear}-${period.term}`}
              className="truncate px-2 py-1 font-semibold text-muted-foreground text-xs"
              style={{ gridColumn: index + 1, gridRow: 1 }}
            >
              {getPeriodLabel(curriculum.termSystem, period)}
            </h2>
          ))}
          <ConnectionsOverlay
            curriculum={curriculum}
            cards={cards}
            size={{ rows, columns }}
            firstRow={HEADER_ROWS + 1}
            selectedCourseId={selectedCourseId}
          />
          {cards.map((card) => (
            <CourseCard
              key={card.id}
              course={card.course}
              curriculum={curriculum}
              color={getCourseColor(curriculum, card.course)}
              isSelected={card.courseId === selectedCourseId}
              onSelect={() =>
                setSelectedCourseId(
                  card.courseId === selectedCourseId ? null : card.courseId,
                )
              }
              className="cursor-pointer"
              style={{
                gridColumn: `${card.column} / span ${card.duration}`,
                gridRow: `${HEADER_ROWS + card.row} / span ${card.height}`,
              }}
            />
          ))}
        </div>
      </section>
      {curriculum.areas.length > 0 && (
        <footer className="flex shrink-0 border-t px-4 py-3 lg:px-8">
          <AreasLegend areas={curriculum.areas} />
        </footer>
      )}
    </div>
  );
}
