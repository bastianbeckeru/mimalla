"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import type { CurriculumData, ExtendedSlot } from "@/types/curriculum";
import ScrollAreaWrapper from "../scroll-area-wrapper";
import { arabicToRoman } from "@/utils/numbers";
import {
  getCurriculumGridData,
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
  PADDING,
} from "@/utils/curriculum-grid";
import PathsOverlay, { PathData } from "./paths-overlay";
import CourseModal from "./course-modal";
import CourseCard from "./course-card";
import { MotionDiv } from "../motion";
import { createConnectionPaths } from "@/utils/pathfinding";

type CurriculumViewProps = {
  data: CurriculumData;
  className?: string;
};

type FocusedSlot = {
  slot: ExtendedSlot;
  relatedPaths: PathData[];
};

type Modal = {
  isOpen: boolean;
  slot: ExtendedSlot;
};

export default function CurriculumView({
  data,
  className,
}: CurriculumViewProps) {
  const { courses, periods, nCols, nRows, slots } = getCurriculumGridData(data);
  const paths = createConnectionPaths(nRows, nCols, slots);

  const [modal, setModal] = useState<Modal | null>(null);
  const [focusedSlot, setFocusedSlot] = useState<FocusedSlot | null>(null);

  const handleSelectCard = useCallback(
    (newSlot: ExtendedSlot | null) => {
      if (newSlot === null) {
        setFocusedSlot(null);
        return;
      }

      if (!newSlot || !newSlot.course || modal?.isOpen) return;

      setFocusedSlot({
        slot: newSlot,
        relatedPaths: paths
          .filter(
            (p) =>
              p.originCardId === String(newSlot.id) ||
              p.destinationCardId === String(newSlot.id),
          )
          .map((p) => ({
            ...p,
            color:
              p.originCardId === String(newSlot.id) ? "#34d399" : "#f87171",
          })),
      });
    },
    [focusedSlot, slots, periods],
  );

  const handleClickCard = useCallback(
    (newSlot: ExtendedSlot) => {
      const course = newSlot.course;

      if (!course) return;

      if (focusedSlot) {
        const connectedCourseIds = [
          focusedSlot.slot.courseId,
          ...focusedSlot.slot.course!.prerequisiteIds,
          ...focusedSlot.slot.course!.subsequentIds,
        ];

        if (!connectedCourseIds.includes(course.id)) {
          setFocusedSlot(null);
          return;
        }
      }

      setModal({
        isOpen: true,
        slot: newSlot,
      });
    },
    [focusedSlot],
  );

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.025, // 0.05 con periods
      },
    },
  };

  return (
    <>
      <ScrollAreaWrapper className={cn(className)}>
        <section aria-label="Malla curricular" className="p-2 pb-4">
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

          <MotionDiv
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${nCols}, ${GRID_CELL_WIDTH}rem)`,
              gridTemplateRows: `repeat(${nRows}, ${GRID_CELL_HEIGHT}rem)`,
              gap: `${GRID_GAP}rem`,
              padding: `${PADDING}rem`,
            }}
            className="relative select-none"
            onClick={(e) => {
              if (focusedSlot && e.target === e.currentTarget)
                setFocusedSlot(null);
            }}
          >
            <div
              role="group"
              aria-labelledby="sem-test"
              style={{
                display: "contents",
              }}
            >
              <h3 id="sem-test" className="sr-only">
                test container
              </h3>
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
                        slot.course &&
                        connectedCourseIds.includes(slot.course.id)
                      )
                    }
                    handleClick={handleClickCard}
                    handleSelect={handleSelectCard}
                  />
                );
              })}
            </div>

            <PathsOverlay paths={focusedSlot ? focusedSlot.relatedPaths : []} />
          </MotionDiv>
        </section>
      </ScrollAreaWrapper>

      <CourseModal
        open={!!modal && modal.isOpen}
        onOpenChange={() => setModal(null)}
        slot={modal && modal.slot}
        courses={courses}
      />
    </>
  );
}
