"use client";

import {
  DragDropContext,
  Draggable,
  type DraggableLocation,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { cn } from "cn";
import { Plus, Save, Undo2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useState } from "react";
import { toast } from "sonner";
import CourseModal from "@/components/curriculum/course-modal";
import AddEnrollmentDialog from "@/components/dashboard/add-enrollment-dialog";
import AddPeriodDialog from "@/components/dashboard/add-period-dialog";
import EnrollmentCard from "@/components/dashboard/rbdnd/enrollment-card";
import PeriodContainer from "@/components/dashboard/rbdnd/period-container";
import { MotionDiv } from "@/components/motion";
import { Button, buttonVariants } from "@/components/ui/button";
import type { HistoryControls } from "@/hooks/use-history";
import type {
  Area,
  ExtendedCourse,
  PeriodKey,
  PeriodWithEnrollments,
} from "@/types/curriculum";
import type { EnrolledCourse, EnrolledCourseStatus } from "@/types/store";
import { DEFAULT_COURSE_COLOR } from "@/utils/colors";
import { getCourseArea } from "@/utils/curriculum";
import { comparePeriodKeys, parsePeriodKey } from "@/utils/period-key";

const MAX_ENROLLMENTS_PER_PERIOD = 10;

type RBDndCurriculumProps = {
  editMode: boolean;
  history: HistoryControls<PeriodWithEnrollments[]>;
  entry: { year: number; term: number };
  areas: Area[];
  courses: Map<number, ExtendedCourse>;
  approvedCourseIds: number[];
  failedCourseIds: number[];
  approvedCredits: number;
  onSave: () => void;
};

type OpenedCourse = {
  course: ExtendedCourse;
  color: string;
};

export default function RBDndCurriculum({
  editMode,
  history,
  entry,
  areas,
  courses,
  approvedCourseIds,
  failedCourseIds,
  approvedCredits,
  onSave,
}: RBDndCurriculumProps) {
  const periods = history.present;
  const [openedCourse, setOpenedCourse] = useState<OpenedCourse | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
  const [addEnrollmentPeriodId, setAddEnrollmentPeriodId] =
    useState<PeriodKey | null>(null);

  const coursesAllowedToAdd = [...courses.values()].filter(
    (c) =>
      (failedCourseIds.includes(c.id) && !approvedCourseIds.includes(c.id)) ||
      c.isElective,
  );

  function isAvailable(course: ExtendedCourse | undefined) {
    if (!course) return true;

    return (
      course.prerequisiteIds.every((id) => approvedCourseIds.includes(id)) &&
      course.prerequisiteCredits <= approvedCredits
    );
  }

  function addEnrollment(periodId: PeriodKey, courseId: number) {
    const period = periods.find((p) => p.id === periodId);
    if (!period) return;

    if (period.enrollments.length >= MAX_ENROLLMENTS_PER_PERIOD) {
      toast("❌ Límite de cursos", {
        description: `No puedes añadir más de ${MAX_ENROLLMENTS_PER_PERIOD} cursos por periodo.`,
      });
      return;
    }

    const isDuplicate = period.enrollments.some((e) => e.courseId === courseId);
    if (isDuplicate && !courses.get(courseId)?.isElective) {
      toast("❌ Curso duplicado", {
        description: "No puedes añadir un curso que ya está en el periodo.",
      });
      return;
    }

    const { year, term } = parsePeriodKey(periodId);
    const enrollment: EnrolledCourse = {
      id: nanoid(),
      courseId,
      status: "PENDING",
      position: period.enrollments.length + 1,
      year,
      term,
    };

    history.commit(
      periods.map((p) =>
        p.id === periodId
          ? { ...p, enrollments: [...p.enrollments, enrollment] }
          : p,
      ),
    );
  }

  function addPeriod(year: number, term: number) {
    const newPeriodIds: PeriodKey[] = [`${year}-${term}`];
    if (term === 3 && !periods.some((p) => p.id === `${year}-1`)) {
      newPeriodIds.push(`${year}-1`);
    }

    history.commit(
      [...periods, ...newPeriodIds.map((id) => ({ id, enrollments: [] }))].sort(
        (a, b) => comparePeriodKeys(a.id, b.id),
      ),
    );
  }

  function handleDragEnd({ source, destination }: DropResult) {
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const sourceIndex = periods.findIndex((p) => p.id === source.droppableId);
    const destinationIndex = periods.findIndex(
      (p) => p.id === destination.droppableId,
    );
    const enrollment = periods[sourceIndex]?.enrollments[source.index];
    const destinationPeriod = periods[destinationIndex];
    if (!enrollment || !destinationPeriod) return;

    if (
      sourceIndex !== destinationIndex &&
      destinationPeriod.enrollments.length >= MAX_ENROLLMENTS_PER_PERIOD
    ) {
      toast("❌ Límite de cursos", {
        description: `No puedes mover un curso a un periodo con ${MAX_ENROLLMENTS_PER_PERIOD} cursos.`,
      });
      return;
    }

    const error = getMoveError(
      periods,
      sourceIndex,
      destinationIndex,
      courses.get(enrollment.courseId),
    );
    if (error) {
      toast("❌ Movimiento inválido", { description: error });
      return;
    }

    history.commit(moveEnrollment(periods, source, destination));
  }

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <MotionDiv
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } },
          }}
          initial="hidden"
          animate="visible"
          className="flex h-max min-h-fit flex-row space-x-2 p-4"
        >
          {periods.map((period) => (
            <Droppable droppableId={period.id} key={period.id}>
              {(provided) => (
                <PeriodContainer
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  id={period.id}
                  entry={entry}
                >
                  {period.enrollments.map((enrollment, index) => {
                    const course = courses.get(enrollment.courseId);
                    const color =
                      (course && getCourseArea(areas, course)?.color) ??
                      DEFAULT_COURSE_COLOR;

                    return (
                      <Draggable
                        key={enrollment.id}
                        index={index}
                        draggableId={enrollment.id}
                        isDragDisabled={!editMode}
                      >
                        {(provided, snapshot) => (
                          <li
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            ref={provided.innerRef}
                            className="mb-2 h-16 w-32 overflow-hidden rounded-md"
                          >
                            <EnrollmentCard
                              enrollment={enrollment}
                              course={course}
                              color={color}
                              isAvailable={isAvailable(course)}
                              editMode={editMode}
                              isDragging={snapshot.isDragging}
                              onOpen={() => {
                                if (!course) return;

                                setOpenedCourse({ course, color });
                                setIsCourseModalOpen(true);
                              }}
                              onStatusChange={(status) =>
                                history.commit(
                                  setEnrollmentStatus(
                                    periods,
                                    enrollment,
                                    status,
                                    courses,
                                  ),
                                )
                              }
                              onDelete={() =>
                                history.commit(
                                  periods.map((p) => ({
                                    ...p,
                                    enrollments: p.enrollments.filter(
                                      (e) => e.id !== enrollment.id,
                                    ),
                                  })),
                                )
                              }
                            />
                          </li>
                        )}
                      </Draggable>
                    );
                  })}
                  {provided.placeholder}

                  {editMode && (
                    <button
                      type="button"
                      className={cn(
                        buttonVariants({ variant: "ghost" }),
                        "flex h-16 w-full rounded-md border text-muted-foreground",
                      )}
                      onClick={() => setAddEnrollmentPeriodId(period.id)}
                    >
                      <Plus />
                    </button>
                  )}
                </PeriodContainer>
              )}
            </Droppable>
          ))}

          {editMode && (
            <button
              type="button"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "flex h-auto w-32 rounded-md border text-muted-foreground",
              )}
              onClick={() => setIsAddPeriodOpen(true)}
            >
              <Plus />
            </button>
          )}
        </MotionDiv>

        {editMode && (
          <div className="absolute right-0 bottom-0 mb-1 w-full p-2 md:right-3 md:bottom-3 md:mb-0 md:size-fit md:p-0">
            <div className="flex size-full items-center justify-between rounded-md bg-muted/75 p-2 md:p-0">
              <Button
                aria-label="Save Changes"
                size="sm"
                variant="outline"
                className="bg-accent text-accent-foreground disabled:bg-transparent md:hidden"
                disabled={!history.canUndo}
                onClick={onSave}
              >
                <Save />
                <span className="sr-only">Guardar</span>
              </Button>

              <div className="flex flex-row items-center rounded-md">
                <Button
                  aria-label="Undo Changes"
                  size="icon"
                  variant="ghost"
                  className="w-10 rounded-r-none md:w-8"
                  disabled={!history.canUndo}
                  onClick={history.undo}
                >
                  <Undo2 />
                </Button>
                <Button
                  aria-label="Redo Changes"
                  size="icon"
                  variant="ghost"
                  className="w-10 rounded-l-none md:w-8"
                  disabled={!history.canRedo}
                  onClick={history.redo}
                >
                  <Undo2 className="-scale-x-100" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </DragDropContext>

      <CourseModal
        open={isCourseModalOpen}
        onOpenChange={setIsCourseModalOpen}
        course={openedCourse?.course ?? null}
        color={openedCourse?.color ?? DEFAULT_COURSE_COLOR}
        courses={courses}
        progress={{ approvedCourseIds, approvedCredits }}
      />

      <AddEnrollmentDialog
        periodId={addEnrollmentPeriodId}
        onOpenChange={(isOpen) => {
          if (!isOpen) setAddEnrollmentPeriodId(null);
        }}
        courses={coursesAllowedToAdd}
        onAdd={addEnrollment}
      />

      <AddPeriodDialog
        open={isAddPeriodOpen}
        onOpenChange={setIsAddPeriodOpen}
        onAdd={addPeriod}
        periods={periods}
      />
    </>
  );
}

function moveEnrollment(
  periods: PeriodWithEnrollments[],
  source: DraggableLocation,
  destination: DraggableLocation,
) {
  const enrollmentsByPeriod = new Map(
    periods.map((p) => [p.id as string, [...p.enrollments]]),
  );
  const [moved] =
    enrollmentsByPeriod.get(source.droppableId)?.splice(source.index, 1) ?? [];
  if (!moved) return periods;

  enrollmentsByPeriod
    .get(destination.droppableId)
    ?.splice(destination.index, 0, moved);

  return periods.map((p) => {
    if (p.id !== source.droppableId && p.id !== destination.droppableId) {
      return p;
    }

    const { year, term } = parsePeriodKey(p.id);

    return {
      ...p,
      enrollments: (enrollmentsByPeriod.get(p.id) ?? []).map((e, index) => ({
        ...e,
        position: index + 1,
        year,
        term,
      })),
    };
  });
}

function getMoveError(
  periods: PeriodWithEnrollments[],
  sourceIndex: number,
  destinationIndex: number,
  course: ExtendedCourse | undefined,
) {
  if (!course || course.isElective || sourceIndex === destinationIndex) {
    return null;
  }

  const destinationPeriod = periods[destinationIndex];
  if (!destinationPeriod) return null;

  if (destinationPeriod.enrollments.some((e) => e.courseId === course.id)) {
    return "Este periodo ya tiene este curso.";
  }

  const isMovingForward = sourceIndex < destinationIndex;
  const relatedIds = isMovingForward
    ? course.subsequentIds
    : course.prerequisiteIds;

  const hasRelatedCourse = (period: PeriodWithEnrollments) =>
    period.enrollments.some((e) => relatedIds.includes(e.courseId));

  if (hasRelatedCourse(destinationPeriod)) {
    return isMovingForward
      ? "Este periodo tiene un curso sucesor."
      : "Este periodo tiene un curso prerequisito.";
  }

  const [start, end] = isMovingForward
    ? [sourceIndex, destinationIndex]
    : [destinationIndex, sourceIndex];

  if (periods.slice(start, end).some(hasRelatedCourse)) {
    return isMovingForward
      ? "Hay un curso sucesor en el camino."
      : "Hay un curso prerequisito en el camino.";
  }

  return null;
}

function setEnrollmentStatus(
  periods: PeriodWithEnrollments[],
  target: EnrolledCourse,
  status: EnrolledCourseStatus,
  courses: Map<number, ExtendedCourse>,
) {
  const revertedCourseIds =
    status === "APPROVED"
      ? new Set<number>()
      : getApprovedSuccessorIds(periods, target.courseId, courses);

  return periods.map((p) => ({
    ...p,
    enrollments: p.enrollments.map((e) => {
      if (e.id === target.id) return { ...e, status };
      if (revertedCourseIds.has(e.courseId)) {
        return { ...e, status: "PENDING" as const };
      }
      return e;
    }),
  }));
}

function getApprovedSuccessorIds(
  periods: PeriodWithEnrollments[],
  courseId: number,
  courses: Map<number, ExtendedCourse>,
) {
  const approvedCourseIds = new Set(
    periods
      .flatMap((p) => p.enrollments)
      .filter((e) => e.status === "APPROVED")
      .map((e) => e.courseId),
  );
  const successorIds = new Set<number>();
  const pendingIds = [courseId];

  for (let id = pendingIds.pop(); id !== undefined; id = pendingIds.pop()) {
    for (const subsequentId of courses.get(id)?.subsequentIds ?? []) {
      if (
        approvedCourseIds.has(subsequentId) &&
        !successorIds.has(subsequentId)
      ) {
        successorIds.add(subsequentId);
        pendingIds.push(subsequentId);
      }
    }
  }

  return successorIds;
}
