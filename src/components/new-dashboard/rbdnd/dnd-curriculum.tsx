"use client";

import { type Dispatch, type SetStateAction, useState } from "react";
import type {
  CurriculumData,
  History,
  ExtendedCourse,
  PeriodKey,
  PeriodWithEnrollments,
  Area,
} from "@/types/curriculum";
import type { EnrolledCourse, EnrolledCourseStatus } from "@/types/store";

import { getCourse, getCourseArea } from "@/utils/curriculum";
import SlotCard from "./slot-card";
import PeriodContainer from "./period-container";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";

import { MotionDiv } from "@/components/motion";
import CourseDialog from "../course-dialog";
import { toast } from "sonner";
import { Check, Clock, Plus, Save, Trash, Undo2, X } from "lucide-react";
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
import { Button, buttonVariants } from "@/components/ui/button";
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

type RBDndCurriculum = {
  editMode: boolean;
  history: History<PeriodWithEnrollments[]>;
  setHistory: Dispatch<SetStateAction<History<PeriodWithEnrollments[]>>>;
  //
  areas: Area[];
  courses: Map<number, ExtendedCourse & { isElective: boolean }>;
  //
  approvedCourseIds: number[];
  failedCourseIds: number[];
  approvedCredits: number;
  //
  handleSaveChanges: () => void;
};

const MAX_HISTORY = 50;
const statusTransitions: Record<EnrolledCourseStatus, EnrolledCourseStatus> = {
  PENDING: "APPROVED",
  APPROVED: "FAILED",
  FAILED: "PENDING",
};

const periodNames: Record<number, string> = {
  1: "Primer semestre",
  2: "Inverno",
  3: "Segundo semestre",
  4: "Verano",
};

export default function RBDndCurriculum({
  editMode,
  history,
  setHistory,
  areas,
  courses,
  approvedCourseIds,
  failedCourseIds,
  approvedCredits,
  handleSaveChanges,
}: RBDndCurriculum) {
  const { showTimeline, autoRescheduleFailed } = useSettingsStore();
  const { curriculums, activeCurriculumId } = useNewCurriculumStore();
  const [activeEnrollment, setActiveEnrollment] = useState<
    | (EnrolledCourse & {
        course: ExtendedCourse | null;
        color?: string;
      })
    | null
  >(null);
  const [openDialogId, setOpenDialogId] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<PeriodKey | null>(
    null,
  );

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
      (failedCourseIds.includes(c.id) && !approvedCourseIds.includes(c.id)) ||
      c.isElective,
  );
  //const coursesAllowedToAdd = Array.from(courses.values());

  const years = countYearOccurrences(history.present);
  const enrolledYear =
    curriculums.find((c) => c.id === activeCurriculumId)?.year ?? 2020;

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <>
      <DragDropContext
        /* onDragStart={() => void} */
        onDragEnd={handleOnDragEnd}
      >
        {showTimeline && (
          <div className="flex flex-row space-x-2 px-4 pt-4 select-none">
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
                <div className="bg-muted-foreground/50 h-px flex-grow"></div>
                <span
                  key={year}
                  className="text-muted-foreground/50 px-2 text-center text-xs font-bold tracking-wider"
                >
                  {Number(year)}
                </span>
                <div className="bg-muted-foreground/50 h-px flex-grow"></div>
              </div>
            ))}
          </div>
        )}

        <MotionDiv
          variants={containerVariants}
          initial="hidden"
          animate="visible"
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
                  curriculumYear={enrolledYear}
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
                          approvedCourseIds.includes(id),
                        ) && course.prerequisiteCredits <= approvedCredits;

                    return (
                      <Draggable
                        key={enrollment.id}
                        index={eIndex}
                        draggableId={enrollment.id}
                        isDragDisabled={!editMode}
                      >
                        {(provided, snapshot) => (
                          <div
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            ref={provided.innerRef}
                            className="mb-2 h-16 w-32 overflow-hidden rounded-md"
                          >
                            <ContextMenu>
                              <ContextMenuTrigger asChild disabled={!editMode}>
                                <SlotCard
                                  className={cn(
                                    "size-full",
                                    editMode && "cursor-grab",
                                    snapshot.isDragging && "shadow-2xl",
                                  )}
                                  enrollment={enrollment}
                                  course={course}
                                  color={color}
                                  isAvailable={isAvailable}
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
                                      let updatedPeriods = [...history.present];

                                      // 1. APPROVED: Change the status of the enrollment
                                      // 2. PENDING: Revert the status of the enrollment and related enrollments
                                      // 3. FAILED: Change the status of the enrollment and related enrollments + LOGIC
                                      if (newStatus === "APPROVED") {
                                        updatedPeriods =
                                          updateCourseEnrollmentStatus({
                                            periods: history.present,
                                            periodId: period.id,
                                            enrollmentId: enrollment.id,
                                            newStatus: "APPROVED",
                                          });
                                      } else {
                                        updatedPeriods =
                                          updateCourseEnrollmentStatusWithRevert(
                                            {
                                              periods: history.present,
                                              courses: courses,
                                              approvedCourseIds:
                                                approvedCourseIds,
                                              enrollmentId: enrollment.id,
                                              enrollmentCourseId:
                                                enrollment.courseId,
                                              newStatus: "PENDING",
                                            },
                                          );
                                      }

                                      setHistory((prev) => {
                                        return {
                                          past: [
                                            ...prev.past,
                                            prev.present,
                                          ].slice(-MAX_HISTORY),
                                          present: updatedPeriods,
                                          future: [],
                                        };
                                      });
                                    }
                                  }}
                                />
                              </ContextMenuTrigger>
                              <ContextMenuContent className="w-52">
                                <ContextMenuItem
                                  disabled={enrollment.status === "APPROVED"}
                                  onClick={() => {
                                    const newPresent =
                                      updateCourseEnrollmentStatus({
                                        periods: history.present,
                                        periodId: period.id,
                                        enrollmentId: enrollment.id,
                                        newStatus: "APPROVED",
                                      });

                                    setHistory((prev) => {
                                      return {
                                        past: [
                                          ...prev.past,
                                          prev.present,
                                        ].slice(-MAX_HISTORY),
                                        present: newPresent,
                                        future: [],
                                      };
                                    });
                                  }}
                                >
                                  <Check />
                                  Marcar como aprobado
                                </ContextMenuItem>
                                <ContextMenuItem
                                  disabled={enrollment.status === "PENDING"}
                                  onClick={() => {
                                    const newPresent =
                                      updateCourseEnrollmentStatusWithRevert({
                                        periods: history.present,
                                        courses: courses,
                                        approvedCourseIds: approvedCourseIds,
                                        enrollmentId: enrollment.id,
                                        enrollmentCourseId: enrollment.courseId,
                                        newStatus: "PENDING",
                                      });

                                    setHistory((prev) => {
                                      return {
                                        past: [
                                          ...prev.past,
                                          prev.present,
                                        ].slice(-MAX_HISTORY),
                                        present: newPresent,
                                        future: [],
                                      };
                                    });
                                  }}
                                >
                                  <Clock />
                                  Marcar como pendiente
                                </ContextMenuItem>
                                <ContextMenuItem
                                  disabled={enrollment.status === "FAILED"}
                                  onClick={() => {
                                    const newPresent =
                                      updateCourseEnrollmentStatusWithRevert({
                                        periods: history.present,
                                        courses: courses,
                                        approvedCourseIds: approvedCourseIds,
                                        enrollmentId: enrollment.id,
                                        enrollmentCourseId: enrollment.courseId,
                                        newStatus: "FAILED",
                                      });

                                    setHistory((prev) => {
                                      return {
                                        past: [
                                          ...prev.past,
                                          prev.present,
                                        ].slice(-MAX_HISTORY),
                                        present: newPresent,
                                        future: [],
                                      };
                                    });
                                  }}
                                >
                                  <X />
                                  Marcar como reprobado
                                </ContextMenuItem>
                                <ContextMenuSeparator />
                                <ContextMenuItem
                                  variant="destructive"
                                  onClick={() => {
                                    const newPresent = deleteCourseEnrollment({
                                      periods: history.present,
                                      periodId: period.id,
                                      enrollmentId: enrollment.id,
                                    });

                                    setHistory((prev) => {
                                      return {
                                        past: [
                                          ...prev.past,
                                          prev.present,
                                        ].slice(-MAX_HISTORY),
                                        present: newPresent,
                                        future: [],
                                      };
                                    });
                                  }}
                                >
                                  <Trash />
                                  Eliminar
                                </ContextMenuItem>
                              </ContextMenuContent>
                            </ContextMenu>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}

                  <button
                    className={cn(
                      buttonVariants({ variant: "ghost" }),
                      "text-muted-foreground hidden h-16 w-full rounded-md border",
                      editMode && "flex",
                    )}
                    onClick={() => {
                      setOpenDialogId("add-course");
                      setSelectedPeriodId(period.id);
                    }}
                  >
                    <Plus />
                  </button>
                </PeriodContainer>
              )}
            </Droppable>
          ))}

          <button
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "text-muted-foreground hidden h-auto w-32 rounded-md border",
              editMode && "flex",
            )}
            onClick={() => setOpenDialogId("add-period")}
          >
            <Plus />
          </button>
        </MotionDiv>

        {editMode && (
          <div className="absolute right-0 bottom-0 mb-1 w-full p-2 md:right-3 md:bottom-3 md:mb-0 md:size-fit md:p-0">
            <div className="bg-muted/75 flex size-full items-center justify-between rounded-md p-2 md:p-0">
              {/* SAVE */}
              <Button
                aria-label="Save Changes"
                size="sm"
                variant="outline"
                className="bg-accent text-accent-foreground disabled:bg-transparent md:hidden"
                disabled={history.past.length === 0}
                onClick={handleSaveChanges}
              >
                <Save />
                <span className="sr-only">Guardar</span>
              </Button>

              {/* UNDO & REDO */}
              <div className="flex flex-row items-center rounded-md">
                <Button
                  aria-label="Undo Changes"
                  size="icon"
                  variant="ghost"
                  className="w-10 rounded-r-none md:w-8"
                  disabled={history.past.length === 0}
                  onClick={undo}
                >
                  <Undo2 />
                </Button>
                <Button
                  aria-label="Redo Changes"
                  size="icon"
                  variant="ghost"
                  className="w-10 rounded-l-none md:w-8"
                  disabled={history.future.length === 0}
                  onClick={redo}
                >
                  <Undo2 className="-scale-x-100" />
                </Button>
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
        approvedCourseIds={approvedCourseIds}
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
            <DialogTitle>Añadir inscripción</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pb-4">
            {selectedPeriodId && (
              <dl>
                <div className="flex flex-row gap-2">
                  <dt className="text-muted-foreground font-medium">Año:</dt>
                  <dd className="text-foreground flex-1">
                    {selectedPeriodId.split("-").map(Number)[0]!}
                  </dd>
                </div>
                <div className="flex flex-row gap-2">
                  <dt className="text-muted-foreground font-medium">
                    Periodo:
                  </dt>
                  <dd className="text-foreground flex-1">
                    {periodNames[selectedPeriodId.split("-").map(Number)[1]!]}
                  </dd>
                </div>
              </dl>
            )}

            <div className="flex flex-row items-center gap-2">
              <h3 className="text-muted-foreground font-medium">Curso:</h3>
              <Select
                value={selectedCourseId ? String(selectedCourseId) : ""}
                onValueChange={(value) => {
                  setSelectedCourseId(Number(value));
                }}
              >
                <SelectTrigger id="courseId" className="w-96">
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
        toast("❌ Límite de cursos", {
          description: "No puedes añadir más de 10 cursos por periodo.",
        });
        return p;
      }

      const course = courses.get(courseId)!;
      if (
        p.enrollments.some((e) => e.courseId === courseId) &&
        !course.isElective
      ) {
        toast("❌ Curso duplicado", {
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
    }
    if (!sourceContainer || !destinationContainer) return;

    if (destinationContainer.enrollments.length >= 10) {
      toast("❌ Límite de cursos", {
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
      toast("❌ Movimiento inválido", {
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
  course: (ExtendedCourse & { isElective: boolean }) | null,
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

function getAllSubsequentCourses({
  courses,
  courseId,
  approvedCourseIds,
}: {
  courses: Map<number, ExtendedCourse & { isElective: boolean }>;
  courseId: number;
  approvedCourseIds: number[];
}) {
  const coursesToRevert: number[] = [];

  function loop(courseId: number) {
    const c = getCourse({
      id: courseId,
      courses,
    });
    if (!c) return;

    c.subsequentIds.forEach((id) => {
      if (approvedCourseIds.includes(id)) {
        coursesToRevert.push(id);
        loop(id);
      }
    });
  }

  loop(courseId);
  return coursesToRevert;
}

function updateCourseEnrollmentStatusWithRevert({
  periods,
  courses,
  approvedCourseIds,
  enrollmentId,
  enrollmentCourseId,
  newStatus = "PENDING",
}: {
  periods: PeriodWithEnrollments[];
  courses: Map<number, ExtendedCourse & { isElective: boolean }>;
  approvedCourseIds: number[];
  enrollmentId: string;
  enrollmentCourseId: number;
  newStatus: EnrolledCourseStatus;
}) {
  const subsequentCoursesToRevert = getAllSubsequentCourses({
    courses: courses,
    courseId: enrollmentCourseId,
    approvedCourseIds: approvedCourseIds,
  });

  return periods.map((p) => {
    const updatedEnrollments = p.enrollments.map((e) => {
      if (e.id !== enrollmentId) {
        const shouldRevert = subsequentCoursesToRevert.includes(e.courseId);

        return {
          ...e,
          status: shouldRevert ? "PENDING" : e.status,
        };
      }

      return {
        ...e,
        status: newStatus,
      };
    });

    return {
      ...p,
      enrollments: updatedEnrollments,
    };
  });
}

function updateCourseEnrollmentStatus({
  periods,
  periodId,
  enrollmentId,
  newStatus,
}: {
  periods: PeriodWithEnrollments[];
  periodId: string;
  enrollmentId: string;
  newStatus: EnrolledCourseStatus;
}) {
  return periods.map((p) => {
    if (p.id === periodId) {
      const updatedEnrollments = p.enrollments.map((e) => {
        if (e.id === enrollmentId) {
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
}

function deleteCourseEnrollment({
  periods,
  periodId,
  enrollmentId,
}: {
  periods: PeriodWithEnrollments[];
  periodId: string;
  enrollmentId: string;
}) {
  return periods.map((p) => {
    if (p.id === periodId) {
      const updatedEnrollments = p.enrollments.filter(
        (e) => e.id !== enrollmentId,
      );

      return {
        ...p,
        enrollments: updatedEnrollments,
      };
    }
    return p;
  });
}

/*


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
                                                nextPeriod.enrollments.some(
                                                  (e) =>
                                                    course.subsequentIds.includes(
                                                      e.courseId,
                                                    ),
                                                );

                                              nextPeriod.enrollments.push({
                                                ...newEnrollment,
                                                position:
                                                  nextPeriod.enrollments
                                                    .length + 1,
                                                year: newYear!,
                                                term: newTerm!,
                                              });

                                              if (
                                                hasNextPeriodSubsequentCourses
                                              ) {
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
*/
