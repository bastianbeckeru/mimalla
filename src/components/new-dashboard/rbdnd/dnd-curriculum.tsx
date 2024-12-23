/* This is a Drag and Drop Curriculum, but it is not GRID based */
"use client";

import { useState } from "react";

import type { CurriculumData, PeriodKey } from "@/types/curriculum";

import { getCourse, getCourseArea } from "@/utils/curriculum";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import type { EnrolledCourse, EnrolledCourseStatus } from "@/types/store";
import ScrollAreaWrapper from "../../ScrollAreaWrapper";
import SlotCard from "./slot-card";
import PeriodContainer from "./period-container";
import { useSettingsStore } from "@/stores/settings";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "react-beautiful-dnd";

import { MotionDiv } from "../../Motion";
import CourseDialog from "../course-dialog";

type RBDndCurriculum = {
  areas: CurriculumData["areas"];
  courses: Map<number, CurriculumData["courses"][0]>;
  studentEnrollmentId: string;
  periods: PeriodWithEnrollments[];
};

type PeriodWithEnrollments = {
  id: PeriodKey;
  enrollments: EnrolledCourse[];
};

export default function RBDndCurriculum({
  studentEnrollmentId,
  periods,
  areas,
  courses,
}: RBDndCurriculum) {
  const { updateCourseEnrollments, updateCourseEnrollmentStatus } =
    useNewCurriculumStore();
  const { editMode } = useSettingsStore();
  const [data, setData] = useState<PeriodWithEnrollments[]>(periods);

  const [activeEnrollment, setActiveEnrollment] = useState<
    | (EnrolledCourse & {
        course: {
          id: number;
          isElective: boolean;
          name: string;
          code: string | null;
          description: string | null;
          duration: number;
          credits: number;
          prerequisiteIds: number[];
          subsequentIds: number[];
        } | null;
        color?: string;
      })
    | null
  >(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ScrollAreaWrapper>
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-row p-4"
          >
            {data.map((period, pIndex) => (
              <Droppable droppableId={period.id} key={period.id}>
                {(provided) => (
                  <PeriodContainer
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    index={pIndex}
                  >
                    {period.enrollments.map((enrollment, eIndex) => {
                      const course = getCourse({
                        id: enrollment.courseId,
                        courses: courses,
                      });
                      const area = course && getCourseArea(areas, course);
                      const color = area?.color;

                      return (
                        <Draggable
                          key={enrollment.id}
                          index={eIndex}
                          draggableId={enrollment.id}
                          isDragDisabled={!editMode}
                        >
                          {(provided, snapshot) => (
                            <SlotCard
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              ref={provided.innerRef}
                              enrollment={enrollment}
                              course={course}
                              color={color}
                              isDragging={snapshot.isDragging}
                              onClick={() => {
                                if (snapshot.isDragging) return;

                                if (!editMode) {
                                  setActiveEnrollment({
                                    ...enrollment,
                                    course: course,
                                    color: color,
                                  });

                                  setIsOpen(true);
                                } else {
                                  const currStatus = enrollment.status;
                                  let newStatus: EnrolledCourseStatus;

                                  if (currStatus === "PENDING") {
                                    newStatus = "APPROVED";
                                  } else if (currStatus === "APPROVED") {
                                    newStatus = "FAILED";
                                  } else if (currStatus === "FAILED") {
                                    newStatus = "PENDING";
                                  }

                                  const newData = data.map((p) => {
                                    if (p.id === period.id) {
                                      return {
                                        ...p,
                                        enrollments: p.enrollments.map((e) => {
                                          if (e.id === enrollment.id) {
                                            return {
                                              ...e,
                                              status: newStatus,
                                            };
                                          }
                                          return e;
                                        }),
                                      };
                                    }
                                    return p;
                                  });

                                  setData(newData);
                                  updateCourseEnrollments(
                                    studentEnrollmentId,
                                    newData.flatMap((p) => p.enrollments),
                                  );
                                }
                              }}
                            />
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </PeriodContainer>
                )}
              </Droppable>
            ))}
          </MotionDiv>
        </DragDropContext>
      </ScrollAreaWrapper>

      <CourseDialog
        isOpen={isOpen}
        onOpenChange={() => {
          setIsOpen(!isOpen);
          setTimeout(() => {
            setActiveEnrollment(null);
          }, 250);
        }}
        course={activeEnrollment?.course}
        color={activeEnrollment?.color}
      />
    </>
  );

  function handleOnDragEnd(event: DropResult) {
    const { source, destination } = event;

    // 0. Check if the drag is valid
    if (
      !destination ||
      (source.index === destination.index &&
        source.droppableId === destination.droppableId)
    )
      return;

    // 1. Find the source and destination containers
    const sourceContainer = periods.find((p) => p.id === source.droppableId);
    const destinationContainer = periods.find(
      (p) => p.id === destination.droppableId,
    );
    if (!sourceContainer || !destinationContainer) return null;

    // 2. Move the element
    function updatePositions(container: PeriodWithEnrollments) {
      const [newYear, newTerm] = container.id.split("-").map(Number);

      return {
        ...container,
        enrollments: container.enrollments.map((slot, index) => {
          return {
            ...slot,
            position: index + 1,
            year: newYear!,
            term: newTerm!,
          };
        }),
      };
    }

    const isSameContainer = sourceContainer.id === destinationContainer.id;
    const sourceElement = sourceContainer.enrollments.splice(
      source.index,
      1,
    )[0]!;

    if (isSameContainer) {
      sourceContainer.enrollments.splice(destination.index, 0, sourceElement);
    } else {
      destinationContainer.enrollments.splice(
        destination.index,
        0,
        sourceElement,
      );
    }

    const newSourceContainer = updatePositions(sourceContainer);
    const newDestinationContainer = isSameContainer
      ? newSourceContainer
      : updatePositions(destinationContainer);

    // 3. Save the data into current state and update the store
    setData((prevData) => {
      const newData = prevData.map((period) => {
        if (period.id === sourceContainer.id) return newSourceContainer;
        if (period.id === destinationContainer.id)
          return newDestinationContainer;
        return period;
      });

      updateCourseEnrollments(
        studentEnrollmentId,
        newData.flatMap((p) => p.enrollments),
      );
      return newData;
    });

    setActiveEnrollment(null);
  }
}
