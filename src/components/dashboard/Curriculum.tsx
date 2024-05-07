"use client";

import type { CurriculumProps } from "@/types/user";

import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { MotionOl } from "../Motion";
import Period from "./Period";
import Course from "./Course";
import { useCurriculumStore, useSettingsStore } from "@/stores/curriculum";

type Props = {
  curriculum: CurriculumProps;
};

export default function Curriculum({ curriculum }: Props) {
  const { onDragEnd } = useCurriculumStore();
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
        className="flex p-4"
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
                    className="flex h-min w-full flex-col overflow-hidden px-1 py-2"
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
                              onClick={
                                () => console.log("o.o")
                                //setIsOpen(true)
                              }
                              className="rounded-2xl"
                            >
                              <Course
                                variants={courseVariants}
                                enrollment={enrollment}
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
}
