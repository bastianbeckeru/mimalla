/* This is a Drag and Drop Curriculum, but it is not GRID based */
"use client";

import { useState } from "react";

import type { CurriculumData, PeriodKey } from "@/types/curriculum";

import {
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  DndContext,
  closestCenter,
  DragOverlay,
  useSensors,
  useSensor,
  MouseSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { getCourse, getCourseArea } from "@/utils/curriculum";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import type { EnrolledCourse } from "@/types/store";
import ScrollAreaWrapper from "../ScrollAreaWrapper";
import { Slot, DraggableSlot } from "./slot";
import PeriodContainer from "./period";

type DndCurriculumProps = {
  programData: CurriculumData;
  studentEnrollmentId: string;
  periods: {
    id: PeriodKey;
    enrollments: EnrolledCourse[];
  }[];
};

export default function DndCurriculum({
  studentEnrollmentId,
  periods,
  programData,
}: DndCurriculumProps) {
  const { updateCourseEnrollments } = useNewCurriculumStore();
  const [data, setData] = useState(periods);
  const [activeEnrollment, setActiveEnrollment] =
    useState<EnrolledCourse | null>(null);

  const { areas } = programData;
  const courses = new Map(programData.courses.map((c) => [c.id, c]));

  /*   const [isOpen, setIsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseProps | null>(
    null,
  ); */

  const sensors = useSensors(useSensor(MouseSensor));

  // FIX: No se puede mover tan rápido un curso de un semestre a otro
  // Posible solución: Utilizar virtual lists.
  return (
    <>
      <ScrollAreaWrapper>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleOnDragStart}
          onDragOver={handleOnDragOver}
          onDragEnd={handleOnDragEnd}
        >
          <div className="flex flex-row gap-2 p-4">
            {data.map((period, pIndex) => (
              <PeriodContainer id={period.id} key={period.id} index={pIndex}>
                <SortableContext
                  items={period.enrollments}
                  strategy={verticalListSortingStrategy}
                >
                  {period.enrollments.map((enrollment) => {
                    const course = getCourse({
                      id: enrollment.courseId,
                      courses: courses,
                    });
                    const area = course && getCourseArea(areas, course);
                    const color = area?.color;

                    return (
                      <DraggableSlot
                        key={enrollment.id}
                        slot={enrollment}
                        course={course}
                        color={color}
                      />
                    );
                  })}
                </SortableContext>
              </PeriodContainer>
            ))}
          </div>
          <DragOverlay>{activeEnrollment && <Slot dragOverlay />}</DragOverlay>
        </DndContext>
      </ScrollAreaWrapper>

      {/*       <CourseDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        course={selectedCourse}
        setSelectedCourse={setSelectedCourse}
      /> */}
    </>
  );

  function handleOnDragStart(event: DragStartEvent) {
    const { active } = event;
    const enrollment =
      periods
        .map((period) => period.enrollments)
        .flat()
        .find((enrollment) => enrollment.id === active.id) ?? null;

    setActiveEnrollment(enrollment);
  }
  function handleOnDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!active || !over) return;

    const overContainer = findContainer(over.id as string);
    const activeContainer = findContainer(active.id as string);
    if (!overContainer || !activeContainer || activeContainer === overContainer)
      return;

    setData((periods) => {
      console.log("IN");
      const [overYear, overTerm] = overContainer.id.split("-").map(Number);
      const overIndex = overContainer.enrollments.findIndex(
        (slot) => slot.id === over.id,
      );

      // Remove active slot from active container
      activeContainer.enrollments = activeContainer.enrollments.filter(
        (slot) => slot.id !== active.id,
      );
      // Add active slot to over container
      overContainer.enrollments.splice(overIndex, 0, {
        ...activeEnrollment!,
        year: overYear!,
        term: overTerm!,
      });

      // Update slot positions
      activeContainer.enrollments = activeContainer.enrollments.map(
        (slot, index) => {
          return { ...slot, position: index + 1 };
        },
      );
      overContainer.enrollments = overContainer.enrollments.map(
        (slot, index) => {
          return { ...slot, position: index + 1 };
        },
      );

      const newPeriods = periods.map((period) => {
        if (period.id === activeContainer.id) {
          return activeContainer;
        }
        if (period.id === overContainer.id) {
          return overContainer;
        }
        return period;
      });

      return newPeriods;
    });
  }
  function handleOnDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!active || !over) return;

    const overContainer = findContainer(over.id as string);
    const activeContainer = findContainer(active.id as string);
    if (!overContainer || !activeContainer) return;

    if (activeContainer === overContainer) {
      setData((periods) => {
        const activeIndex = activeContainer.enrollments.findIndex(
          (slot) => slot.id === active.id,
        );
        const overIndex = overContainer.enrollments.findIndex(
          (slot) => slot.id === over.id,
        );

        // Move active slot to new position
        activeContainer.enrollments = arrayMove(
          activeContainer.enrollments,
          activeIndex,
          overIndex,
        );
        // Update slot positions
        activeContainer.enrollments = activeContainer.enrollments.map(
          (slot, index) => {
            return { ...slot, position: index + 1 };
          },
        );

        const newPeriods = periods.map((period) => {
          if (period.id === activeContainer.id) {
            return activeContainer;
          }
          return period;
        });

        updateCourseEnrollments(
          studentEnrollmentId,
          newPeriods.map((p) => p.enrollments).flat(),
        );
        return newPeriods;
      });
    }

    setActiveEnrollment(null);
  }
  function findContainer(id: string) {
    return periods.find((period) =>
      period.enrollments.some((slot) => slot.id === id),
    );
  }
}
