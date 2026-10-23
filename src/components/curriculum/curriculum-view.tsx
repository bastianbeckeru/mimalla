"use client";

import { useState } from "react";
import CourseCard from "@/components/curriculum/course-card";
import CourseModal from "@/components/curriculum/course-modal";
import PathsOverlay, {
  type PathData,
} from "@/components/curriculum/paths-overlay";
import { MotionDiv } from "@/components/motion";
import ScrollAreaWrapper from "@/components/scroll-area-wrapper";
import type { CurriculumData, ExtendedSlot } from "@/types/curriculum";
import { DEFAULT_COURSE_COLOR } from "@/utils/colors";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
  getCurriculumGridData,
  PADDING,
} from "@/utils/curriculum-grid";
import { arabicToRoman } from "@/utils/numbers";
import { createConnectionPaths } from "@/utils/pathfinding";

type CurriculumViewProps = {
  data: CurriculumData;
  className?: string;
};

type FocusedSlot = {
  slot: ExtendedSlot;
  relatedPaths: PathData[];
};

export default function CurriculumView({
  data,
  className,
}: CurriculumViewProps) {
  const { courses, periods, nCols, nRows, slots } = getCurriculumGridData(data);
  const paths = createConnectionPaths(nRows, nCols, slots);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalSlot, setModalSlot] = useState<ExtendedSlot | null>(null);
  const [focusedSlot, setFocusedSlot] = useState<FocusedSlot | null>(null);

  const connectedCourseIds = new Set(
    focusedSlot
      ? [
          focusedSlot.slot.courseId,
          ...(focusedSlot.slot.course?.prerequisiteIds ?? []),
          ...(focusedSlot.slot.course?.successorIds ?? []),
        ]
      : [],
  );

  function handleSelectCard(newSlot: ExtendedSlot | null) {
    if (newSlot === null) {
      setFocusedSlot(null);
      return;
    }

    if (!newSlot.course || isModalOpen) return;

    const slotId = String(newSlot.id);

    setFocusedSlot({
      slot: newSlot,
      relatedPaths: paths
        .filter(
          (p) => p.originCardId === slotId || p.destinationCardId === slotId,
        )
        .map((p) => ({
          ...p,
          color: p.originCardId === slotId ? "#34d399" : "#f87171",
        })),
    });
  }

  function handleClickCard(newSlot: ExtendedSlot) {
    const { course } = newSlot;
    if (!course) return;

    if (focusedSlot && !connectedCourseIds.has(course.id)) {
      setFocusedSlot(null);
      return;
    }

    setModalSlot(newSlot);
    setIsModalOpen(true);
  }

  return (
    <>
      <ScrollAreaWrapper className={className}>
        <section aria-label="Malla curricular" className="p-2 pb-4">
          <div
            className="flex flex-row gap-2"
            style={{
              paddingLeft: `${PADDING}rem`,
              paddingRight: `${PADDING}rem`,
            }}
          >
            {periods.map((pKey, pIndex) => (
              <div
                key={pKey}
                className="relative flex h-7 justify-center rounded-md p-2"
                style={{ width: `${GRID_CELL_WIDTH}rem` }}
              >
                <span className="w-full text-center font-bold text-muted-foreground text-xs tracking-wider">
                  SEMESTRE {arabicToRoman(pIndex + 1)}
                </span>
              </div>
            ))}
          </div>

          <MotionDiv
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.025 } },
            }}
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
            <div className="contents">
              {slots.map((slot, sIndex) => (
                <CourseCard
                  key={slot.id}
                  index={sIndex}
                  slot={slot}
                  isSelected={focusedSlot?.slot.id === slot.id}
                  isNotRelated={
                    !!focusedSlot &&
                    !(
                      slot.course && connectedCourseIds.has(slot.course.id)
                    )
                  }
                  handleClick={handleClickCard}
                  handleSelect={handleSelectCard}
                />
              ))}
            </div>

            <PathsOverlay paths={focusedSlot ? focusedSlot.relatedPaths : []} />
          </MotionDiv>
        </section>
      </ScrollAreaWrapper>

      <CourseModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        course={modalSlot?.course ?? null}
        color={modalSlot?.color ?? DEFAULT_COURSE_COLOR}
        courses={courses}
      />
    </>
  );
}
