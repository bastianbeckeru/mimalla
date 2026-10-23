"use client";

import {
  DragDropContext,
  Draggable,
  Droppable,
  type DropResult,
} from "@hello-pangea/dnd";
import { cn } from "cn";
import { Plus, Save, Undo2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import CourseModal from "@/components/curriculum/course-modal";
import { MotionDiv } from "@/components/motion";
import AddEnrollmentDialog from "@/components/trajectory/add-enrollment-dialog";
import AddPeriodDialog from "@/components/trajectory/add-period-dialog";
import EnrollmentCard from "@/components/trajectory/enrollment-card";
import PeriodContainer from "@/components/trajectory/period-container";
import { Button, buttonVariants } from "@/components/ui/button";
import type { HistoryControls } from "@/hooks/use-history";
import type { Area, ExtendedCourse, PeriodKey } from "@/types/curriculum";
import type { Entry, PeriodWithEnrollments } from "@/types/trajectory";
import { DEFAULT_COURSE_COLOR } from "@/utils/colors";
import { getCourseArea } from "@/utils/curriculum";
import {
  addEnrollment,
  addPeriod,
  type EditError,
  getAddableCourses,
  isAvailable,
  MAX_ENROLLMENTS_PER_PERIOD,
  moveEnrollment,
  removeEnrollment,
  setEnrollmentStatus,
} from "@/utils/trajectory";

const PERIOD_FULL_TOAST = {
  title: "❌ Límite de cursos",
  description: `No puedes añadir más de ${MAX_ENROLLMENTS_PER_PERIOD} cursos por periodo.`,
};

const ADD_ERROR_TOASTS: Partial<
  Record<EditError, { title: string; description: string }>
> = {
  PERIOD_FULL: PERIOD_FULL_TOAST,
  DUPLICATE_COURSE: {
    title: "❌ Curso duplicado",
    description: "No puedes añadir un curso que ya está en el periodo.",
  },
};

const MOVE_ERROR_DESCRIPTIONS: Record<EditError, string> = {
  PERIOD_FULL: `No puedes mover un curso a un periodo con ${MAX_ENROLLMENTS_PER_PERIOD} cursos.`,
  DUPLICATE_COURSE: "Este periodo ya tiene este curso.",
  SUCCESSOR_IN_PERIOD: "Este periodo tiene un curso sucesor.",
  PREREQUISITE_IN_PERIOD: "Este periodo tiene un curso prerequisito.",
  SUCCESSOR_ON_THE_WAY: "Hay un curso sucesor en el camino.",
  PREREQUISITE_ON_THE_WAY: "Hay un curso prerequisito en el camino.",
};

type TrajectoryBoardProps = {
  editMode: boolean;
  history: HistoryControls<PeriodWithEnrollments[]>;
  entry: Entry;
  areas: Area[];
  courses: Map<number, ExtendedCourse>;
  progress: {
    approvedCourseIds: number[];
    approvedCredits: number;
  };
  onSave: () => void;
};

type OpenedCourse = {
  course: ExtendedCourse;
  color: string;
};

export default function TrajectoryBoard({
  editMode,
  history,
  entry,
  areas,
  courses,
  progress,
  onSave,
}: TrajectoryBoardProps) {
  const periods = history.present;
  const [openedCourse, setOpenedCourse] = useState<OpenedCourse | null>(null);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isAddPeriodOpen, setIsAddPeriodOpen] = useState(false);
  const [addEnrollmentPeriodId, setAddEnrollmentPeriodId] =
    useState<PeriodKey | null>(null);

  function handleAddEnrollment(periodId: PeriodKey, courseId: number) {
    const course = courses.get(courseId);
    if (!course) return;

    const result = addEnrollment(periods, periodId, course);
    if (result.error) {
      const errorToast = ADD_ERROR_TOASTS[result.error];
      if (errorToast) {
        toast(errorToast.title, { description: errorToast.description });
      }
      return;
    }

    history.commit(result.periods);
  }

  function handleDragEnd({ source, destination }: DropResult) {
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )
      return;

    const result = moveEnrollment(
      periods,
      { periodId: source.droppableId, index: source.index },
      { periodId: destination.droppableId, index: destination.index },
      courses,
    );
    if (result.error) {
      const title =
        result.error === "PERIOD_FULL"
          ? PERIOD_FULL_TOAST.title
          : "❌ Movimiento inválido";
      toast(title, { description: MOVE_ERROR_DESCRIPTIONS[result.error] });
      return;
    }

    history.commit(result.periods);
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
                              isAvailable={
                                !course || isAvailable(course, progress)
                              }
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
                                    enrollment.id,
                                    status,
                                    courses,
                                  ),
                                )
                              }
                              onDelete={() =>
                                history.commit(
                                  removeEnrollment(periods, enrollment.id),
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
        progress={progress}
      />

      <AddEnrollmentDialog
        periodId={addEnrollmentPeriodId}
        onOpenChange={(isOpen) => {
          if (!isOpen) setAddEnrollmentPeriodId(null);
        }}
        courses={getAddableCourses(
          courses,
          periods.flatMap((p) => p.enrollments),
        )}
        onAdd={handleAddEnrollment}
      />

      <AddPeriodDialog
        open={isAddPeriodOpen}
        onOpenChange={setIsAddPeriodOpen}
        onAdd={(year, term) =>
          history.commit(addPeriod(periods, { year, term }))
        }
        periods={periods}
      />
    </>
  );
}
