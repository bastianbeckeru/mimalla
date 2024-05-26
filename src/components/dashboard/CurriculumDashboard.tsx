"use client";

import type { ModifiedCurriculumProps } from "@/types/curriculum";

import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { MotionOl } from "../Motion";
import Period from "./Period";
import Course from "./Course";
import { useCurriculumStore, useSettingsStore } from "@/stores/curriculum";

type Props = {
  curriculum: ModifiedCurriculumProps;
};

export default function CurriculumDashboard({ curriculum }: Props) {
  const { areas, onDragEnd } = useCurriculumStore();
  const { editMode } = useSettingsStore();

  /* Animations */
  const variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  };
  const periodVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
  const courseVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <MotionOl
        variants={variants}
        initial="hidden"
        animate="visible"
        className="flex flex-row gap-2 p-4"
      >
        {curriculum.periods.map((period, pIndex) => {
          return (
            <Period
              key={period.id}
              variants={periodVariants}
              period={{
                id: period.id,
                index: pIndex,
                coursesAmount: period.enrollments.length,
              }}
            >
              <Droppable droppableId={period.id.toString()}>
                {(provided) => (
                  <ul
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="flex flex-col"
                  >
                    {period.enrollments.map((enrollment, eIndex) => {
                      return (
                        <Draggable
                          key={enrollment.id}
                          index={eIndex}
                          draggableId={enrollment.id.toString()}
                          isDragDisabled={!editMode}
                        >
                          {(provided) => (
                            <div
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                              className="rounded-2xl"
                            >
                              <Course
                                variants={courseVariants}
                                enrollment={enrollment}
                                color={getColor(enrollment.course?.id)}
                              />
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </Period>
          );
        })}
      </MotionOl>
    </DragDropContext>
  );

  function getColor(id: string | null | undefined) {
    const hexColor = "#f1f5f9";

    if (!id) return hexColor;

    const area = areas.find((area) =>
      area.courses.some((course) => course.id === id),
    );

    return area?.color ?? hexColor;
  }
}
