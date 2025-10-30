"use client";

import { useCallback, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
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
  SlotExtended,
} from "@/utils/curriculum-grid";
import PathsOverlay, { PathData } from "./paths-overlay";
import CourseModal from "./course-modal";
import CourseCard from "./course-card";

type CurriculumViewProps = {
  data: CurriculumData;
  className?: string;
};

type FocusedSlot = {
  slot: SlotExtended;
  relatedPaths: PathData[];
};

type Modal = {
  isOpen: boolean;
  slot: SlotExtended;
};

export default function CurriculumView({
  data,
  className,
}: CurriculumViewProps) {
  const { courses, periods, nCols, nRows, creditsMode, slots } =
    getCurriculumGridData(data);

  const [modal, setModal] = useState<Modal | null>(null);
  const [focusedSlot, setFocusedSlot] = useState<FocusedSlot | null>(null);

  const handleSelectCard = useCallback(
    (newSlot: SlotExtended | null) => {
      if (newSlot === null) {
        setFocusedSlot(null);

        return;
      }

      if (!newSlot || !newSlot.course || modal?.isOpen) return;

      const relatedPaths = getRelatedPaths({
        originSlot: newSlot,
        slots: slots,
      });

      setFocusedSlot({
        slot: newSlot,
        relatedPaths: relatedPaths,
      });

      /* 
        slotId: `${newSlot.year}-${newSlot.term}-${newSlot.position}`,
        connectedCourseIds: [
          ...newSlot.course.prerequisiteIds,
          ...newSlot.course.subsequentIds,
          newSlot.course.id,
        ], */
    },
    [focusedSlot, slots, periods],
  );

  const handleClickCard = useCallback(
    (newSlot: SlotExtended) => {
      const course = newSlot.course;

      if (!course) return;

      if (!focusedSlot) {
        setModal({
          isOpen: true,
          slot: newSlot,
        });
      } else {
        const connectedCourseIds = [
          focusedSlot.slot.courseId,
          ...focusedSlot.slot.course!.prerequisiteIds,
          ...focusedSlot.slot.course!.subsequentIds,
        ];

        if (!connectedCourseIds.includes(course.id)) {
          setFocusedSlot(null);
        }
      }
    },
    [focusedSlot],
  );

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
              if (focusedSlot && e.target === e.currentTarget)
                setFocusedSlot(null);
            }}
          >
            {slots.map((slot, sIndex) => {
              const slotId = `${slot.year}-${slot.term}-${slot.position}`; // TEMPORARY UNTIL DB
              const focusedSlotId = focusedSlot
                ? `${focusedSlot.slot.year}-${focusedSlot.slot.term}-${focusedSlot.slot.position}`
                : ""; // TEMPORARY UNTIL DB

              const connectedCourseIds = focusedSlot
                ? [
                    focusedSlot.slot.courseId,
                    ...focusedSlot.slot.course!.prerequisiteIds,
                    ...focusedSlot.slot.course!.subsequentIds,
                  ]
                : [];

              return (
                <CourseCard
                  key={slotId}
                  index={sIndex}
                  slot={slot}
                  isSelected={focusedSlotId === slotId}
                  isNotRelated={
                    !!focusedSlotId &&
                    !(
                      slot.course && connectedCourseIds.includes(slot.course.id)
                    )
                  }
                  handleClick={handleClickCard}
                  handleSelect={handleSelectCard}
                />
              );
            })}

            <PathsOverlay paths={focusedSlot ? focusedSlot.relatedPaths : []} />
          </div>
        </div>
      </ScrollAreaWrapper>

      <CourseModal
        isOpen={!!modal && modal.isOpen}
        onOpenChange={() => setModal(null)}
        slot={modal && modal.slot}
      />
    </>
  );
}
