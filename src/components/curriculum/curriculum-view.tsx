"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { checkContrasts } from "@/utils/colors";
import type { CurriculumData } from "@/types/curriculum";
import ScrollAreaWrapper from "../scroll-area-wrapper";
import { arabicToRoman } from "@/utils/numbers";
import {
  getRelatedPaths,
  getCurriculumGridData,
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
  PADDING,
} from "@/utils/curriculum-grid";
import PathsOverlay, { PathData } from "./paths-overlay";
import { useLongPress } from "@/hooks/use-long-press";
import { Card, CardContent } from "@/components/ui/card";
import CourseModal from "./course-modal";

type CurriculumViewProps = {
  data: CurriculumData;
  className?: string;
};

export default function CurriculumView({
  data,
  className,
}: CurriculumViewProps) {
  const { curriculum, areas } = data;
  const { courses, periods, nCols, nRows, creditsMode, slots } =
    getCurriculumGridData(data);

  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [relatedPaths, setRelatedPaths] = useState<
    { paths: string[]; color: string }[]
  >([]);

  const processedPaths = useMemo<PathData[]>(() => {
    if (!selectedId || relatedPaths.length === 0) return [];

    return relatedPaths.flatMap((related, rIdx) =>
      related.paths.map((path, pIdx) => ({
        id: `${rIdx}-${pIdx}`,
        path,
        color: related.color,
      })),
    );
  }, [selectedId, relatedPaths]);

  const handleSelectCard = useCallback(
    (newCardId: string | null, slot: any) => {
      const course = slot.course;

      if (!course || isOpen) return;

      const relatedPaths = getRelatedPaths({
        originSlot: slot,
        slots: curriculum.structure, // cambiar por serializedSlots
        periods: periods,
        course: course,
      });

      setRelatedPaths(relatedPaths);
      setSelectedCourses([
        ...course.prerequisiteIds,
        ...course.subsequentIds,
        course.id,
      ]);
      setSelectedId(newCardId);
    },
    [selectedId, curriculum.structure, periods],
  );

  const handleClickCard = useCallback(
    (slot: any) => {
      const course = slot.course;

      if (!course) return;
      if (selectedId && !selectedCourses.includes(course.id)) {
        handleClearSelection();
        return;
      }

      setSelectedSlot(slot);
      setIsOpen(true);
    },
    [selectedCourses],
  );

  function handleClearSelection() {
    setSelectedId(null);
    setSelectedCourses([]);
    setRelatedPaths([]);
  }

  return (
    <>
      <ScrollAreaWrapper className={cn(className)}>
        <div className="p-2 pb-4">
          <div
            className="flex flex-row gap-2"
            style={{
              paddingLeft: `${PADDING}rem`,
              paddingRight: `${PADDING}rem`,
            }}
          >
            {periods.map((pKey, pIndex) => {
              //const [year, term] = pKey.split("-").map(Number);

              return (
                <div
                  key={pKey}
                  className="relative flex h-7 justify-center rounded-md p-2"
                  style={{
                    width: `${GRID_CELL_WIDTH}rem`,
                  }}
                >
                  <span
                    className={`text-muted-foreground w-full text-center text-xs font-bold tracking-wider`}
                  >
                    SEMESTRE {arabicToRoman(pIndex + 1)}
                  </span>
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${nCols}, ${GRID_CELL_WIDTH}rem)`,
              gridTemplateRows: `repeat(${nRows}, ${GRID_CELL_HEIGHT}rem)`,
              gap: `${GRID_GAP}rem`,
              padding: `${PADDING}rem`,
            }}
            className="relative"
            onClick={(e) => {
              if (!selectedId) return;
              if (e.target === e.currentTarget) handleClearSelection();
            }}
          >
            {slots.map((slot, sIndex) => {
              const { course, color, x, y, w, h } = slot;
              // const enrollment = enrollments.get(slot.id);

              const cardId = `${slot.year}-${slot.term}-${slot.position}`;
              const isRelated = course && selectedCourses.includes(course.id);

              const {
                hasLowBackgroundElementContrast,
                hasLowElementTextContrast,
              } = checkContrasts({ elementColor: color });

              const handleLongPress = (event: MouseEvent | TouchEvent) =>
                handleSelectCard(cardId, slot);

              const longPressHandlers = useLongPress(handleLongPress, {
                onClick: () => handleClickCard(slot),
                onHover: () => handleSelectCard(cardId, slot),
                onHoverEnd: () => handleSelectCard(null, slot),
                hoverDelay: 50,
                threshold: 700,
              });

              const isSelected = selectedId === cardId;

              return (
                <Card
                  {...longPressHandlers}
                  key={cardId}
                  id={cardId}
                  className={cn(
                    "cursor-pointer transition-[filter] select-none",
                    hasLowBackgroundElementContrast &&
                      "border-foreground/50 border",
                    hasLowElementTextContrast && "text-background",
                    selectedId && !isRelated && "brightness-[25%]",
                    isSelected && "ring-accent border-accent border-1 ring-1",
                  )}
                  style={{
                    backgroundColor: color,
                    gridColumn: `${x} / span ${w}`,
                    gridRow: `${y} / span ${h}`,
                  }}
                >
                  <CardContent className="flex h-full items-center justify-center p-2">
                    <h3 className="text-center text-xs font-medium text-balance">
                      {course?.name ?? `Slot ${sIndex + 1}`}
                    </h3>
                  </CardContent>
                </Card>
              );
            })}

            <PathsOverlay paths={processedPaths} />
          </div>
        </div>
      </ScrollAreaWrapper>

      <CourseModal
        isOpen={isOpen}
        onOpenChange={() => setIsOpen(!isOpen)}
        slot={selectedSlot}
      />
    </>
  );
}
