"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import type {
  CurriculumData,
  History,
  ModifiedCourse,
  PeriodKey,
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
import { Plus, Trash, Undo2 } from "lucide-react";
import useShortcuts from "@/hooks/use-shortcut";
import { cn } from "@/lib/utils";
import { nanoid } from "nanoid";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AddPeriodDialog from "../add-period-dialog";
import { useNewCurriculumStore } from "@/stores/newCurriculum";
import { useSettingsStore } from "@/stores/settings";

type RBDndCurriculum = {
  editMode: boolean;
  history: History<PeriodWithEnrollments[]>;
  setHistory: Dispatch<SetStateAction<History<PeriodWithEnrollments[]>>>;
  //
  areas: CurriculumData["areas"];
  courses: Map<number, CurriculumData["courses"][0]>;
  //
  approvedCourses: number[];
  failedCourses: number[];
  approvedCredits: number;
};

const MAX_HISTORY = 50;
const statusTransitions: Record<EnrolledCourseStatus, EnrolledCourseStatus> = {
  PENDING: "APPROVED",
  APPROVED: "FAILED",
  FAILED: "PENDING",
};

const periodNames: Record<number, string> = {
  1: "primer semestre",
  2: "inverno",
  3: "segundo semestre",
  4: "verano",
};

export default function RBDndCurriculum({
  editMode,
  history,
  setHistory,
  areas,
  courses,
  approvedCourses,
  failedCourses,
  approvedCredits,
}: RBDndCurriculum) {
  const { showTimeline, autoRescheduleFailed } = useSettingsStore();
  const { curriculums, activeCurriculumId } = useNewCurriculumStore();
  const [activeEnrollment, setActiveEnrollment] = useState<
    | (EnrolledCourse & {
        course: ModifiedCourse;
        color?: string;
      })
    | null
  >(null);
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<PeriodKey | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);

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

  const coursesAllowedToAdd = Array.from(courses.values()).filter(
    (c) =>
      (failedCourses.includes(c.id) && !approvedCourses.includes(c.id)) ||
      c.isElective,
  );
  //const coursesAllowedToAdd = Array.from(courses.values());

  const years = countYearOccurrences(history.present);
  const enrolledYear =
    curriculums.find((c) => c.id === activeCurriculumId)?.year ?? 2020;

  return (
    <>
      <DragDropContext
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleOnDragEnd}
      >
        <ScrollAreaWrapper>
          {showTimeline && (
            <div className="flex select-none flex-row space-x-2 px-4 pb-2 pt-4">
              {years.map(({ year, count }) => (
                <div
                  key={year}
                  className={cn(
                    "flex min-w-32 flex-row items-center justify-center",
                    count === 2 && "w-[16.5rem]",
                    count === 3 && "w-[25.0rem]",
                    count === 4 && "w-[33.5rem]",
                  )}
                >
                  <div className="h-px flex-grow bg-muted-foreground/50"></div>
                  <span
                    key={year}
                    className="px-2 text-center text-xs font-bold tracking-wider text-muted-foreground/50"
                  >
                    {Number(year) + enrolledYear - 1}
                  </span>
                  <div className="h-px flex-grow bg-muted-foreground/50"></div>
                </div>
              ))}
            </div>
          )}

          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={cn(
              "flex h-max min-h-fit flex-row space-x-2 px-4 pb-4",
              !showTimeline && "pt-4",
            )}
          >
            {history.present.map((period, pIndex) => (
              <Droppable droppableId={period.id} key={period.id}>
                {(provided) => (
                  <PeriodContainer
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    id={period.id}
                  >
                    {period.enrollments.map((enrollment, eIndex) => {
                      const course = getCourse({
                        id: enrollment.courseId,
                        courses: courses,
                      });
                      const area = course && getCourseArea(areas, course);
                      const color = area?.color;

                      const isAvailable = !course
                        ? true
                        : course.prerequisiteIds.every((id) =>
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

                                  setOpenDialogId("course-info");
                                } else {
                                  if (!isAvailable) return;

                                  const newStatus =
                                    statusTransitions[enrollment.status];
                                  const currentPeriods = [...history.present];
                                  let updatedPeriods = currentPeriods;

                                  // 1. APPROVED: Change the status of the enrollment
                                  // 2. PENDING: Revert the status of the enrollment and related enrollments
                                  // 3. FAILED: Change the status of the enrollment and related enrollments + LOGIC
                                  if (
                                    !course ||
                                    course.isElective ||
                                    newStatus === "APPROVED"
                                  ) {
                                    updatedPeriods = updatedPeriods.map((p) => {
                                      if (p.id === period.id) {
                                        const updatedEnrollments =
                                          p.enrollments.map((e) => {
                                            if (e.id === enrollment.id) {
                                              return {
                                                ...e,
                                                status: newStatus,
                                              };
                                            }

                                            return e;
                                          });

                                        return {
                                          ...p,
                                          enrollments: updatedEnrollments,
                                        };
                                      }
                                      return p;
                                    });
                                  } else {
                                    const coursesToRevert =
                                      collectSubsequentCourses(
                                        enrollment.courseId,
                                      );
                                    updatedPeriods = revert(
                                      currentPeriods,
                                      coursesToRevert,
                                    );

                                    // EXTRA LOGIC
                                    if (
                                      newStatus === "FAILED" &&
                                      autoRescheduleFailed
                                    ) {
                                      // Add a new enrollment with the same course to the next period
                                      const nextPeriod = updatedPeriods.at(
                                        pIndex + 1,
                                      );
                                      const newEnrollment = {
                                        id: nanoid(),
                                        courseId: enrollment.courseId,
                                        status:
                                          "PENDING" as EnrolledCourseStatus,
                                      };

                                      if (!nextPeriod) {
                                        const [year, term] = period.id
                                          .split("-")
                                          .map(Number);
                                        const [newYear, newTerm] =
                                          term === 2
                                            ? [year! + 1, 1]
                                            : [year!, 2];

                                        updatedPeriods.push({
                                          id: `${newYear}-${newTerm}`,
                                          enrollments: [
                                            {
                                              ...newEnrollment,
                                              position: 1,
                                              year: newYear,
                                              term: newTerm,
                                            },
                                          ],
                                        });
                                      } else {
                                        if (
                                          !nextPeriod.enrollments.some(
                                            (e) =>
                                              e.courseId ===
                                              enrollment.courseId,
                                          )
                                        ) {
                                          const [newYear, newTerm] =
                                            nextPeriod.id
                                              .split("-")
                                              .map(Number);
                                          const hasNextPeriodSubsequentCourses =
                                            nextPeriod.enrollments.some((e) =>
                                              course.subsequentIds.includes(
                                                e.courseId,
                                              ),
                                            );

                                          nextPeriod.enrollments.push({
                                            ...newEnrollment,
                                            position:
                                              nextPeriod.enrollments.length + 1,
                                            year: newYear!,
                                            term: newTerm!,
                                          });

                                          if (hasNextPeriodSubsequentCourses) {
                                            // Move every subsequent course to the next period
                                            updatedPeriods =
                                              moveSubsequentCourses(
                                                updatedPeriods,
                                                enrollment.courseId,
                                              );
                                          }
                                        }
                                      }
                                    }
                                  }

                                  function revert(
                                    periods: PeriodWithEnrollments[],
                                    coursesToRevert: number[] = [],
                                  ) {
                                    return periods.map((p) => {
                                      const updatedEnrollments =
                                        p.enrollments.map((e) => {
                                          if (e.id === enrollment.id) {
                                            return {
                                              ...e,
                                              status: newStatus,
                                            };
                                          }

                                          const shouldRevert =
                                            coursesToRevert.includes(
                                              e.courseId,
                                            );
                                          return {
                                            ...e,
                                            status: shouldRevert
                                              ? "PENDING"
                                              : e.status,
                                          };
                                        });

                                      return {
                                        ...p,
                                        enrollments: updatedEnrollments,
                                      };
                                    });
                                  }

                                  setHistory((prev) => {
                                    return {
                                      past: [...prev.past, prev.present].slice(
                                        -MAX_HISTORY,
                                      ),
                                      present: updatedPeriods,
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

                    <button
                      className={cn(
                        "hidden h-8 w-32 items-center justify-center rounded-md border text-muted-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
                        editMode &&
                          "flex hover:bg-accent hover:text-accent-foreground",
                      )}
                      onClick={() => {
                        setOpenDialogId("add-course");
                        setSelectedPeriodId(period.id);
                      }}
                    >
                      <Plus className="size-4" />
                    </button>
                  </PeriodContainer>
                )}
              </Droppable>
            ))}

            <button
              className={cn(
                "hidden w-32 flex-col items-center justify-center rounded-md border p-2 text-muted-foreground transition-colors [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
                editMode && "flex hover:bg-accent hover:text-accent-foreground",
              )}
              onClick={() => setOpenDialogId("add-period")}
            >
              <Plus />
            </button>
          </MotionDiv>
        </ScrollAreaWrapper>

        {editMode && (
          <div className="m-2 grid grid-cols-3 items-center rounded-md bg-muted p-2 transition-transform md:bg-transparent">
            <div></div>

            <div className="mx-auto">
              <Droppable droppableId="trash">
                {(provided, snapshot) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    id="trash"
                    className={cn(
                      "flex h-10 w-24 items-center justify-center rounded-md bg-black/25 p-2 shadow-inner transition-all md:h-14 md:w-32 md:bg-muted [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
                      snapshot.isDraggingOver &&
                        "h-20 w-36 border-2 border-foreground bg-destructive md:h-20 md:w-36 md:bg-destructive",
                    )}
                  >
                    <Trash />
                    <div className="absolute">{provided.placeholder}</div>
                  </div>
                )}
              </Droppable>
            </div>

            <div className="flex size-full items-end justify-end">
              <div className="flex h-10 w-28 flex-row items-center justify-end rounded-md bg-muted md:h-8 md:w-16">
                <button
                  className="flex size-full items-center justify-center rounded-l-md transition-colors hover:bg-muted-foreground disabled:text-muted-foreground disabled:hover:bg-muted [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  onClick={() => undo()}
                  disabled={history.past.length === 0}
                >
                  <Undo2 />
                </button>
                <button
                  className="flex size-full items-center justify-center rounded-r-md transition-colors hover:bg-muted-foreground disabled:text-muted-foreground disabled:hover:bg-muted [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0"
                  onClick={redo}
                  disabled={history.future.length === 0}
                >
                  <Undo2 className="-scale-x-100" />
                </button>
              </div>
            </div>
          </div>
        )}
      </DragDropContext>

      <CourseDialog
        isOpen={openDialogId === "course-info"}
        onOpenChange={() => {
          setOpenDialogId(null);
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

      <Dialog
        open={openDialogId === "add-course"}
        onOpenChange={() => {
          setOpenDialogId(null);
          setSelectedCourseId(null);
          setSelectedPeriodId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Inscripción</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <p>
              Inscribir en el{" "}
              {selectedPeriodId && (
                <span>
                  {`${periodNames[selectedPeriodId.split("-").map(Number)[1]!]} del ${selectedPeriodId.split("-").map(Number)[0]! + enrolledYear - 1}`}
                </span>
              )}
            </p>

            <Select
              onValueChange={(value) => {
                setSelectedCourseId(Number(value));
              }}
              value={selectedCourseId ? String(selectedCourseId) : ""}
            >
              <SelectTrigger id="courseId">
                <SelectValue placeholder="Selecciona un curso" />
              </SelectTrigger>
              <SelectContent className="w-96">
                {coursesAllowedToAdd.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancelar
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                onClick={() => {
                  if (!selectedPeriodId || !selectedCourseId) return;

                  const [year, term] = selectedPeriodId.split("-").map(Number);

                  const newPresent = handleAddEnrollment({
                    periods: history.present,
                    courseId: selectedCourseId,
                    year: year!,
                    term: term!,
                  });

                  setHistory((prev) => {
                    return {
                      past: [...prev.past, prev.present].slice(-MAX_HISTORY),
                      present: newPresent,
                      future: [],
                    };
                  });
                }}
              >
                Añadir
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddPeriodDialog
        open={openDialogId === "add-period"}
        onOpenChange={() => {
          setOpenDialogId(null);
        }}
        handleAddPeriod={(year, term) => {
          const newPeriodId: PeriodKey = `${year}-${term}`;
          const newPeriod = { id: newPeriodId, enrollments: [] };
          const updatedData = [...history.present];

          // If term 3, check if term 1 exists and add it if not
          if (term === 3) {
            const firstSemesterExists = history.present.some(
              (p) => p.id === `${year}-1`,
            );

            if (!firstSemesterExists) {
              const newSemesterId: PeriodKey = `${year}-${1}`;
              const newSemester = { id: newSemesterId, enrollments: [] };

              updatedData.push(newSemester);
            }
          }

          updatedData.push(newPeriod);

          const updatedSortedData = updatedData.sort((a, b) => {
            const [yearA, termA] = a.id.split("-").map(Number);
            const [yearB, termB] = b.id.split("-").map(Number);
            return yearA !== yearB ? yearA! - yearB! : termA! - termB!;
          });

          setHistory((prev) => {
            return {
              past: [...prev.past, prev.present].slice(-MAX_HISTORY),
              present: updatedSortedData,
              future: [],
            };
          });
        }}
        periods={history.present}
      />
    </>
  );

  function handleAddEnrollment({
    periods,
    courseId,
    year,
    term,
  }: {
    periods: PeriodWithEnrollments[];
    courseId: number;
    year: number;
    term: number;
  }) {
    const updatedPeriods = [...periods];
    const periodId = `${year}-${term}`;

    return updatedPeriods.map((p) => {
      if (p.id !== periodId) return p;

      if (p.enrollments.length >= 10) {
        toast({
          title: "❌ Límite de cursos",
          description: "No puedes añadir más de 10 cursos por periodo.",
        });
        return p;
      }
      const course = courses.get(courseId)!;
      if (
        p.enrollments.some((e) => e.courseId === courseId) &&
        !course.isElective
      ) {
        toast({
          title: "❌ Curso duplicado",
          description: "No puedes añadir un curso que ya está en el periodo.",
        });
        return p;
      }

      const newEnrollment = {
        id: nanoid(),
        courseId: courseId,
        status: "PENDING" as EnrolledCourseStatus,
        position: p.enrollments.length + 1,
        year: year,
        term: term,
      };

      return {
        ...p,
        enrollments: [...p.enrollments, newEnrollment],
      };
    });
  }

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

    if (sourceContainer && destination.droppableId === "trash") {
      setHistory((prev) => {
        const newPresent = prev.present.map((p) => {
          if (p.id === sourceContainer.id)
            return {
              ...p,
              enrollments: p.enrollments.filter(
                (_, index) => index !== source.index,
              ),
            };
          return p;
        });

        return {
          past: [...prev.past, prev.present].slice(-MAX_HISTORY),
          present: newPresent,
          future: [],
        };
      });
      setIsDragging(false);
    }
    if (!sourceContainer || !destinationContainer) return;

    if (destinationContainer.enrollments.length >= 10) {
      toast({
        title: "❌ Límite de cursos",
        description:
          "No puedes mover un curso a un destino que contenga 10 cursos o más.",
      });
      return;
    }
    //
    const sourceEnrollment = sourceContainer.enrollments[source.index]!;
    const sourceCourse = getCourse({
      id: sourceEnrollment.courseId,
      courses,
    });

    // 1. Check if the move is valid
    const { isValid, error } = isValidMove(
      currentPeriods,
      sourceContainerIndex,
      destinationContainerIndex,
      sourceCourse,
    );

    if (!isValid) {
      toast({
        title: "❌ Movimiento inválido",
        description: error,
      });
      return;
    }

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
    setIsDragging(false);
  }

  function collectSubsequentCourses(courseId: number) {
    const coursesToRevert: number[] = [];

    function loop(courseId: number) {
      const c = getCourse({
        id: courseId,
        courses,
      });
      if (!c) return;

      c.subsequentIds.forEach((id) => {
        if (approvedCourses.includes(id)) {
          coursesToRevert.push(id);
          loop(id);
        }
      });
    }
    loop(courseId);
    return coursesToRevert;
  }
  function moveSubsequentCourses(
    periods: PeriodWithEnrollments[],
    courseId: number,
  ) {
    const newPeriods = [...periods];

    function loop(courseId: number) {
      const c = getCourse({
        id: courseId,
        courses,
      });
      if (!c) return;

      // For each subsequent course, move it to the next period
      // only if the previous course moved was a prerequisite and is in the same period
      c.subsequentIds.forEach((id) => {
        const periodIndex = newPeriods.findIndex((p) =>
          p.enrollments.some((e) => e.courseId === id),
        );

        if (periodIndex === -1) return;

        const sourcePeriod = newPeriods[periodIndex];
        const destinationPeriod = newPeriods[periodIndex + 1];

        if (!sourcePeriod || !destinationPeriod) return;

        const hasSourceContainerRelatedCourses = sourcePeriod.enrollments.some(
          (e) => c.subsequentIds.includes(e.courseId),
        );

        if (!hasSourceContainerRelatedCourses) return;

        const sourceIndex = sourcePeriod.enrollments.findIndex(
          (e) => e.courseId === id,
        );
        const destinationIndex = destinationPeriod.enrollments.length;

        const { newSourceContainer, newDestinationContainer } = reorder(
          sourcePeriod,
          destinationPeriod,
          sourceIndex,
          destinationIndex,
        );

        newPeriods[periodIndex] = newSourceContainer;
        newPeriods[periodIndex + 1] = newDestinationContainer;

        loop(id);
      });
    }

    loop(courseId);
    return newPeriods;
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
): { isValid: boolean; error?: string } {
  // 💡 Maybe add credits limit. 30 credits per term, for example, 0 by default. User can change it.

  // Enrollments without courses (if exist) can move anywhere.
  // Enrollments with elective courses can move anywhere.
  // Enrollments can move freely within the same container.
  if (
    !course ||
    course.isElective ||
    sourceContainerIndex === destinationContainerIndex
  )
    return { isValid: true };

  const destinationContainer = currentPeriods[destinationContainerIndex]!;

  const hasContainerSameCourse = destinationContainer.enrollments.some(
    (c) => c.courseId === course.id,
  );

  if (hasContainerSameCourse)
    return {
      isValid: false,
      error: "Este periodo ya tiene este curso.",
    };

  const isMovingForward = sourceContainerIndex < destinationContainerIndex;
  const relatedIds = isMovingForward
    ? course.subsequentIds
    : course.prerequisiteIds;

  const hasContainerRelatedCourses = destinationContainer.enrollments.some(
    (e) => relatedIds.includes(e.courseId),
  );

  if (hasContainerRelatedCourses)
    return {
      isValid: false,
      error: isMovingForward
        ? "Este periodo tiene un curso sucesor."
        : "Este periodo tiene un curso prerequisito.",
    };

  // Can not move after a subsequents or before a prerequisites courses
  const [startIndex, endIndex] = isMovingForward
    ? [sourceContainerIndex, destinationContainerIndex]
    : [destinationContainerIndex, sourceContainerIndex];

  const isBlockingRelatedCourses = currentPeriods
    .slice(startIndex, endIndex)
    .some((p) => p.enrollments.some((e) => relatedIds.includes(e.courseId)));

  if (isBlockingRelatedCourses) {
    return {
      isValid: false,
      error: isMovingForward
        ? "Hay un curso sucesor en el camino."
        : "Hay un curso prerequisito en el camino.",
    };
  }

  return { isValid: true };
}

function countYearOccurrences(periods: PeriodWithEnrollments[]) {
  // Extract years from ids
  const years = periods.map((p) => p.id.split("-")[0]!);

  // Count occurrences of each year
  const yearCounts = years.reduce<Record<string, number>>((acc, year) => {
    acc[year] = (acc[year] ?? 0) + 1;
    return acc;
  }, {});

  // Convert to array of [year, count] pairs
  return Object.entries(yearCounts).map(([year, count]) => ({
    year,
    count,
  }));
}
