/* This is a Drag and Drop Curriculum, but it is not GRID based */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { CurriculumData, PeriodKey } from "@/types/curriculum";

import {
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type CollisionDetection,
  DndContext,
  closestCenter,
  DragOverlay,
  useSensors,
  useSensor,
  MouseSensor,
  pointerWithin,
  getFirstCollision,
  rectIntersection,
  closestCorners,
  TouchSensor,
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
  const [clonedData, setClonedData] = useState(null);
  const [activeEnrollment, setActiveEnrollment] =
    useState<EnrolledCourse | null>(null);

  const { areas } = programData;
  const courses = new Map(programData.courses.map((c) => [c.id, c]));

  const lastOverId = useRef<number | string | undefined | null>(null);
  const recentlyMovedToNewContainer = useRef(false);

  const customCollisionDetectionAlgorithm: CollisionDetection = useCallback(
    (args) => {
      const activeId = activeEnrollment?.id;
      const isEnrollment = data.some((period) =>
        period.enrollments.some((e) => e.id === activeId),
      );

      const pointerIntersections = pointerWithin(args);
      const intersections =
        pointerIntersections.length > 0
          ? pointerIntersections
          : rectIntersection(args);

      let overId = getFirstCollision(intersections, "id");
      //console.log("FIRST INTERSECTION", overId);

      /*       console.log("CENTER", closestCenter(args));
      console.log("CORNERS", closestCorners(args)); */

      if (overId) {
        const overContainer = data.find((period) => period.id === overId);
        //console.log("OVER CONTAINER", overContainer?.id);

        if (overContainer && overContainer.enrollments.length > 0) {
          const overContainerIntersections = closestCenter({
            ...args,
            droppableContainers: args.droppableContainers.filter(
              (container) =>
                container.id !== overId &&
                overContainer.enrollments.some((e) => e.id === container.id),
            ),
          });

          const firstIntersection = overContainerIntersections[0]!;

          overId = firstIntersection.id;
        }

        lastOverId.current = overId;

        return [{ id: overId }];
      }

      if (recentlyMovedToNewContainer.current) {
        lastOverId.current = activeId;
      }

      return lastOverId.current ? [{ id: lastOverId.current }] : [];
    },
    [data, activeEnrollment?.id],
  );

  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  useEffect(() => {
    requestAnimationFrame(() => {
      recentlyMovedToNewContainer.current = false;
    });
  });

  // FIX: No se puede mover tan rápido un curso de un semestre a otro
  // Posible solución: Utilizar virtual lists.
  return (
    <>
      <ScrollAreaWrapper>
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetectionAlgorithm}
          onDragStart={handleOnDragStart}
          onDragOver={handleOnDragOver}
          onDragEnd={handleOnDragEnd}
          onDragCancel={handleOnDragCancel}
        >
          <div className="flex flex-row p-4">
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
    //setClonedData(data);
  }
  function handleOnDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!active || !over) return;

    const isOverSlot = data.some((period) =>
      period.enrollments.some((e) => e.id === over.id),
    );
    //if (isOverSlot) return;

    //const overContainer = findContainer(over.id as string);
    const overContainer = isOverSlot
      ? findContainer(over.id as string)
      : data.find((period) => period.id === over.id);
    const activeContainer = findContainer(active.id as string);
    if (!overContainer || !activeContainer || activeContainer === overContainer)
      return;

    console.log("### HANDLE-OVER", overContainer.id);
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

      recentlyMovedToNewContainer.current = true;

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
  function handleOnDragCancel() {
    console.log("CLONED-DATA", clonedData);
    if (clonedData) {
      setData(clonedData);
    }

    setActiveEnrollment(null);
    setClonedData(null);
  }
  function findContainer(id: string) {
    return periods.find((period) =>
      period.enrollments.some((slot) => slot.id === id),
    );
  }
}
