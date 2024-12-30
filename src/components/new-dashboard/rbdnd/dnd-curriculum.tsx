"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import type {
  CurriculumData,
  History,
  ModifiedCourse,
  PeriodWithEnrollments,
} from "@/types/curriculum";
import type { EnrolledCourse, EnrolledCourseStatus } from "@/types/store";

import { getCourse, getCourseArea } from "@/utils/curriculum";
import ScrollAreaWrapper from "../../ScrollAreaWrapper";
import SlotCard from "./slot-card";
import PeriodContainer from "./period-container";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "react-beautiful-dnd";

import { MotionDiv } from "../../Motion";
import CourseDialog from "../course-dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Undo2 } from "lucide-react";
import useShortcuts from "@/hooks/use-shortcut";
import { Button } from "@/components/ui/button";

type RBDndCurriculum = {
  editMode: boolean;
  history: History<PeriodWithEnrollments[]>;
  setHistory: Dispatch<SetStateAction<History<PeriodWithEnrollments[]>>>;
  //
  areas: CurriculumData["areas"];
  courses: Map<number, CurriculumData["courses"][0]>;
  //
  approvedCourses: number[];
  approvedCredits: number;
};

const MAX_HISTORY = 15;

export default function RBDndCurriculum({
  editMode,
  history,
  setHistory,
  areas,
  courses,
  approvedCourses,
  approvedCredits,
}: RBDndCurriculum) {
  console.log("RBDndCurriculum has been rendered.");
  const [activeEnrollment, setActiveEnrollment] = useState<
    | (EnrolledCourse & {
        course: ModifiedCourse;
        color?: string;
      })
    | null
  >(null);
  const [isOpen, setIsOpen] = useState(false);

  useShortcuts([
    {
      keys: ["Control", "z"],
      handler: () => {
        if (editMode) undo();
      },
    },
    {
      keys: ["Control", "Shift", "Z"],
      handler: () => {
        if (editMode) redo();
      },
    },
  ]);

  return (
    <>
      <ScrollAreaWrapper>
        <DragDropContext
          onDragStart={() => {
            navigator.vibrate?.(50);
          }}
          onDragEnd={handleOnDragEnd}
        >
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-row space-x-2 p-4"
          >
            {history.present.map((period, pIndex) => (
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

                      const isAvailable =
                        course?.prerequisiteIds.every((id) =>
                          approvedCourses.includes(id),
                        ) && course.prerequisiteCredits <= approvedCredits;

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
                              isAvailable={isAvailable}
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
                                  if (!isAvailable) return;

                                  let newStatus: EnrolledCourseStatus;

                                  if (enrollment.status === "PENDING") {
                                    newStatus = "APPROVED";
                                  } else if (enrollment.status === "APPROVED") {
                                    newStatus = "FAILED";
                                  } else if (enrollment.status === "FAILED") {
                                    newStatus = "PENDING";
                                  }

                                  const coursesToPending: number[] = [];

                                  function getSubsequentCoursesLoop(
                                    courseId: number,
                                  ) {
                                    const course = getCourse({
                                      id: courseId,
                                      courses,
                                    });
                                    if (!course) return;

                                    course.subsequentIds.forEach((id) => {
                                      if (approvedCourses.includes(id)) {
                                        coursesToPending.push(id);
                                        getSubsequentCoursesLoop(id);
                                      }
                                    });
                                  }

                                  getSubsequentCoursesLoop(enrollment.courseId);

                                  setHistory((prev) => {
                                    const newPresent = prev.present.map((p) => {
                                      if (
                                        newStatus === "APPROVED" &&
                                        p.id !== period.id
                                      )
                                        return p;

                                      return {
                                        ...p,
                                        enrollments: p.enrollments.map((e) => {
                                          if (e.id === enrollment.id) {
                                            return {
                                              ...e,
                                              status: newStatus,
                                            };
                                          }

                                          const isToPending =
                                            newStatus !== "APPROVED" &&
                                            coursesToPending.includes(
                                              e.courseId,
                                            );

                                          return {
                                            ...e,
                                            status: isToPending
                                              ? "PENDING"
                                              : e.status,
                                          };
                                        }),
                                      };
                                    });

                                    return {
                                      past: [...prev.past, prev.present].slice(
                                        -MAX_HISTORY,
                                      ),
                                      present: newPresent,
                                      future: [],
                                    };
                                  });
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
            {editMode && (
              <button className="flex w-32 flex-col items-center justify-center rounded-md border p-2 hover:bg-accent hover:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0">
                <Plus />
                Periodo
              </button>
            )}
          </MotionDiv>
        </DragDropContext>

        {editMode && (
          <div className="absolute bottom-4 right-4 flex h-8 w-16 flex-row justify-center rounded-md border bg-muted md:left-4">
            <button
              className="flex size-8 items-center justify-center rounded-l-md transition-colors hover:bg-muted-foreground disabled:text-muted-foreground disabled:hover:bg-muted"
              onClick={() => undo()}
              disabled={history.past.length === 0}
            >
              <Undo2 className="size-4" />
            </button>
            <button
              className="flex size-8 items-center justify-center rounded-r-md transition-colors hover:bg-muted-foreground disabled:text-muted-foreground disabled:hover:bg-muted"
              onClick={redo}
              disabled={history.future.length === 0}
            >
              <Undo2 className="size-4 -scale-x-100" />
            </button>
          </div>
        )}
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
        courses={courses}
        approvedCourses={approvedCourses}
        approvedCredits={approvedCredits}
      />
    </>
  );

  function undo() {
    const { past, present, future } = history;

    if (past.length === 0 || !present) return;

    const previous = past[past.length - 1]!;
    const newPast = past.slice(0, -1);

    setHistory({
      past: newPast,
      present: previous,
      future: [present, ...future].slice(0, MAX_HISTORY),
    });
  }

  function redo() {
    const { past, present, future } = history;

    if (future.length === 0 || !present) return;

    const next = future[0]!;
    const newFuture = future.slice(1);

    setHistory({
      past: [...past, present].slice(-MAX_HISTORY),
      present: next,
      future: newFuture,
    });
  }

  function handleOnDragEnd(event: DropResult) {
    const { source, destination } = event;

    if (!destination) return;
    if (
      source.index === destination.index &&
      source.droppableId === destination.droppableId
    )
      return;

    const currentPeriods: PeriodWithEnrollments[] = [...history.present];
    const sourceContainerIndex = currentPeriods.findIndex(
      (p) => p.id === source.droppableId,
    );
    const destinationContainerIndex = currentPeriods.findIndex(
      (p) => p.id === destination.droppableId,
    );
    const sourceContainer = currentPeriods[sourceContainerIndex];
    const destinationContainer = currentPeriods[destinationContainerIndex];

    if (!sourceContainer || !destinationContainer) return;

    //
    const sourceEnrollment = sourceContainer.enrollments[source.index]!;
    const sourceCourse = getCourse({
      id: sourceEnrollment.courseId,
      courses,
    });

    // 1. Check if the move is valid
    if (
      !isValidMove(
        currentPeriods,
        sourceContainerIndex,
        destinationContainerIndex,
        sourceCourse,
      )
    )
      return;

    // 2. Reorder the data
    const { newSourceContainer, newDestinationContainer } = reorder(
      sourceContainer,
      destinationContainer,
      source.index,
      destination.index,
    );

    // 3. Save the data into current state and update the store
    setHistory((prev) => {
      const newPresent = prev.present.map((p) => {
        if (p.id === sourceContainer.id) return newSourceContainer;
        if (p.id === destinationContainer.id) return newDestinationContainer;
        return p;
      });

      return {
        past: [...prev.past, prev.present].slice(-MAX_HISTORY),
        present: newPresent,
        future: [],
      };
    });
  }
}

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

function reorder(
  sourceContainer: PeriodWithEnrollments,
  destinationContainer: PeriodWithEnrollments,
  sourceIndex: number,
  destinationIndex: number,
) {
  const isSameContainer = sourceContainer.id === destinationContainer.id;

  const newSourceContainer = {
    ...sourceContainer,
    enrollments: [...sourceContainer.enrollments],
  };
  const newDestinationContainer = {
    ...destinationContainer,
    enrollments: [...destinationContainer.enrollments],
  };

  const movedEnrollment = newSourceContainer.enrollments.splice(
    sourceIndex,
    1,
  )[0]!;

  if (isSameContainer) {
    newSourceContainer.enrollments.splice(destinationIndex, 0, movedEnrollment);
  } else {
    newDestinationContainer.enrollments.splice(
      destinationIndex,
      0,
      movedEnrollment,
    );
  }

  const updatedSourceContainer = updatePositions(newSourceContainer);
  const updatedDestinationContainer = isSameContainer
    ? updatedSourceContainer
    : updatePositions(newDestinationContainer);

  return {
    newSourceContainer: updatedSourceContainer,
    newDestinationContainer: updatedDestinationContainer,
  };
}

function isValidMove(
  currentPeriods: PeriodWithEnrollments[],
  sourceContainerIndex: number,
  destinationContainerIndex: number,
  course: ModifiedCourse | null,
) {
  if (!course || sourceContainerIndex === destinationContainerIndex)
    return true;

  const destinationContainer = currentPeriods[destinationContainerIndex]!;

  // 1. Check if the destination container has a course that is a prerequisite or subsequent of the course being moved
  const hasContainerRelatedCourses = destinationContainer.enrollments.some(
    (e) =>
      course.prerequisiteIds.includes(e.courseId) ||
      course.subsequentIds.includes(e.courseId),
  );

  if (hasContainerRelatedCourses) {
    toast({
      title: "❌ Error",
      description:
        "No puedes mover un curso a un destino que contenga un curso prerequisito o sucesor.",
    });
    return false;
  }

  const hasBlockingCourses = (
    startIndex: number,
    endIndex: number,
    relatedIds: number[],
  ): boolean => {
    const range = currentPeriods.slice(startIndex + 1, endIndex);
    return range.some((p) =>
      p.enrollments.some((e) => relatedIds.includes(e.courseId)),
    );
  };

  // 2. Check if the move will block any subsequent or prerequisite courses
  if (sourceContainerIndex < destinationContainerIndex) {
    const hasBlockingSubsequents = hasBlockingCourses(
      sourceContainerIndex,
      destinationContainerIndex,
      course.subsequentIds,
    );

    if (hasBlockingSubsequents) {
      toast({
        title: "❌ Error",
        description: "No puedes mover un curso adelante de un curso sucesor.",
      });
    }

    return !hasBlockingSubsequents;
  } else {
    const hasBlockingPrerequisites = hasBlockingCourses(
      destinationContainerIndex,
      sourceContainerIndex,
      course.prerequisiteIds,
    );

    if (hasBlockingPrerequisites) {
      toast({
        title: "❌ Error",
        description: "No puedes mover un curso atrás de un curso prerequisito.",
      });
    }
    return !hasBlockingPrerequisites;
  }
}
