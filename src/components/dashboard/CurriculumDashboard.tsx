"use client";

import type {
  AreaProps,
  CourseProps,
  ModifiedCurriculumProps,
} from "@/types/curriculum";

import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { MotionOl } from "../Motion";
import Period from "./Period";
import { useCurriculumStore, useSettingsStore } from "@/stores/curriculum";
import Enrollment from "./Enrollment";
import { useState } from "react";
import CourseDialog from "./CourseDialog";

type Props = {
  curriculum: ModifiedCurriculumProps;
};

export default function CurriculumDashboard({ curriculum }: Props) {
  const { areas, onDragEnd } = useCurriculumStore();
  const { editMode } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseProps | null>(
    null,
  );
  const [selectedColor, setSelectedColor] = useState<string>("#f1f5f9"); // TEMPORAL

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
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <MotionOl
          variants={variants}
          initial="hidden"
          animate="visible"
          className="flex flex-row gap-2 p-4"
        >
          {curriculum.periods.map((period, pIndex) => {
            return (
              <Period key={period.id} variants={periodVariants} index={pIndex}>
                <Droppable droppableId={period.id.toString()}>
                  {(provided) => (
                    <ul
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex flex-col"
                    >
                      {period.enrollments.map((enrollment, eIndex) => {
                        const { course, color } = getCourse(
                          enrollment.courseId,
                          areas,
                        );

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
                                <Enrollment
                                  variants={courseVariants}
                                  enrollment={enrollment}
                                  course={course}
                                  color={color}
                                  openDialog={() => {
                                    if (course) {
                                      setSelectedCourse(course);
                                      setSelectedColor(color);
                                    }
                                    setIsOpen(true);
                                  }}
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

      <CourseDialog
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        course={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        color={selectedColor}
      />
    </>
  );
}

function getCourse(id: string | null | undefined, areas: AreaProps[]) {
  const defaultColor = "#f1f5f9"; // Hex

  if (!id || !areas) return { course: null, color: defaultColor };

  for (const area of areas) {
    const course = area.courses.find((course) => course.id === id);

    if (course) {
      return {
        course: course,
        color: area.color ?? defaultColor,
      };
    }
  }

  return { course: null, color: defaultColor };
}
