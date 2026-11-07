"use client";

import type { DragEndEvent, DragMoveEvent } from "@dnd-kit/dom";
import { Feedback } from "@dnd-kit/dom";
import { DragDropProvider } from "@dnd-kit/react";
import { useEffect, useRef, useState } from "react";
import AddEnrollmentDialog from "@/components/trajectory/add-enrollment-dialog";
import {
  getClosingEnrollments,
  getMoveOptions,
  getPassedPeriodOptions,
  getSchemeSource,
} from "@/components/trajectory/board-options";
import { sensors } from "@/components/trajectory/board-sensors";
import ClosePeriodDialog from "@/components/trajectory/close-period-dialog";
import CoursePanel, {
  PEEK_SNAP_POINT,
} from "@/components/trajectory/course-panel";
import {
  getStatusNotice,
  showEditError,
} from "@/components/trajectory/edit-feedback";
import { STATUS_LABELS } from "@/components/trajectory/enrollment-card";
import MoveEnrollmentDialog from "@/components/trajectory/move-enrollment-dialog";
import PassedPeriodsDialog from "@/components/trajectory/passed-periods-dialog";
import TrajectoryGrid, {
  ENTER_STAGGER_MS,
  type Gesture,
  hasLeftStart,
} from "@/components/trajectory/trajectory-grid";
import { useBoardPanel } from "@/components/trajectory/use-board-panel";
import {
  useOpeningScroll,
  useRevealPanelCard,
} from "@/components/trajectory/use-board-scroll";
import { useGridGesture } from "@/hooks/use-grid-gesture";
import { useIsMobile } from "@/hooks/use-mobile";
import { useConnectionFocus } from "@/stores/connections";
import type { Course, Curriculum, PeriodKey } from "@/types/curriculum";
import type {
  ChangeNotice,
  Enrollment,
  EnrollmentStatus,
  Entry,
  GradingScale,
  Placement,
} from "@/types/trajectory";
import { extendCourses } from "@/utils/curriculum";
import { parsePeriodKey } from "@/utils/period-key";
import {
  addEnrollment,
  moveEnrollment,
  removeEnrollment,
  retakeEnrollment,
} from "@/utils/trajectory/edits";
import {
  getNextPeriod,
  getOpeningColumn,
  getPeriodEndRow,
  getPeriodInfo,
  layOutTrajectory,
  type PlacedEnrollment,
} from "@/utils/trajectory/layout";
import {
  approveThroughPeriod,
  getAddableCourses,
  getProgress,
  isAvailable,
  setEnrollmentStatus,
  setEnrollmentStatuses,
} from "@/utils/trajectory/progress";

const ENTER_MS = 300;

type PeriodClosing = { period: PeriodKey; isOpen: boolean };

export default function TrajectoryBoard({
  enrollments,
  entry,
  curriculum,
  gradingScale,
  isNew,
  onChange,
}: {
  enrollments: Enrollment[];
  entry: Entry;
  curriculum: Curriculum;
  gradingScale: GradingScale;
  isNew: boolean;
  onChange: (enrollments: Enrollment[], notice?: ChangeNotice) => void;
}) {
  const isMobile = useIsMobile();
  const { firstCellRef, getCellUnder, keepDropOrigin, takeDropOrigin } =
    useGridGesture();
  const sectionRef = useRef<HTMLElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const [periodClosing, setPeriodClosing] = useState<PeriodClosing | null>(
    null,
  );
  const [isAskingPassedPeriods, setIsAskingPassedPeriods] = useState(isNew);
  const [addPlacement, setAddPlacement] = useState<Placement | null>(null);
  const [isEntering, setIsEntering] = useState(true);

  const context = { entry, curriculum };
  const courses = extendCourses(curriculum.courses);
  const progress = getProgress(enrollments, courses);
  const addableCourses = getAddableCourses(courses, enrollments);

  const base = layOutTrajectory(enrollments, context);
  const nextPeriod = getNextPeriod(base.periods);
  const gesturePeriods = nextPeriod
    ? [...base.periods, nextPeriod]
    : base.periods;
  const {
    panelCard,
    selectedId,
    isPanelOpen,
    setIsPanelOpen,
    snapPoint,
    setSnapPoint,
    openPanel,
    selectCard,
    markDragStart,
    markDragEnd,
  } = useBoardPanel({ sectionRef, isMobile, cards: base.cards });
  const [firstVisibleColumn] = useState(() => getOpeningColumn(base, entry));

  useEffect(() => {
    const timeout = setTimeout(
      () => setIsEntering(false),
      ENTER_STAGGER_MS * base.periods.length + ENTER_MS,
    );
    return () => clearTimeout(timeout);
  }, [base.periods.length]);

  useOpeningScroll({ sectionRef, firstCellRef, firstVisibleColumn });

  useRevealPanelCard({
    sectionRef,
    firstCellRef,
    isMobile,
    isPanelOpen,
    snapPoint,
    card: panelCard,
  });

  const passedPeriodOptions = getPassedPeriodOptions(base.periods, entry);
  const moveOptions = panelCard
    ? getMoveOptions({
        enrollments,
        card: panelCard,
        periods: gesturePeriods,
        currentPeriod: base.periods[panelCard.column - 1],
        context,
        getPeriodLabel,
      })
    : [];
  const closingEnrollments = getClosingEnrollments({
    cards: base.cards,
    column: periodClosing
      ? base.periods.indexOf(periodClosing.period) + 1
      : null,
    gradingScale,
    progress,
  });

  function hasPendingEnrollments(column: number) {
    return base.cards.some(
      (card) => card.column === column && card.enrollment.status === "PENDING",
    );
  }

  function addAtPeriodEnd(period: PeriodKey, column: number) {
    setAddPlacement({
      period,
      row: getPeriodEndRow(base.cards, column),
    });
  }

  function getPeriodLabel(period: PeriodKey) {
    const { label } = getPeriodInfo(period, entry);
    return `${label} (${parsePeriodKey(period).year})`;
  }

  function getMove(operation: DragMoveEvent["operation"]): Gesture | null {
    const card = base.cards.find((card) => card.id === operation.source?.id);
    const rect = operation.shape?.current.boundingRectangle;
    const cell =
      card &&
      rect &&
      getCellUnder(rect, {
        columns: gesturePeriods.length,
        duration: card.duration,
      });
    const period = cell && gesturePeriods[cell.column - 1];
    return card && cell && period
      ? { dragId: card.id, placement: { period, row: cell.row } }
      : null;
  }

  function moveTo(card: PlacedEnrollment, period: PeriodKey) {
    const result = moveEnrollment(
      enrollments,
      card.id,
      {
        period,
        row: getPeriodEndRow(
          base.cards.filter((other) => other.id !== card.id),
          base.periods.indexOf(period) + 1,
        ),
      },
      context,
    );
    if (result.error) {
      showEditError("No se puede mover el curso", result.error);
      return;
    }
    setIsMoveOpen(false);
    onChange(result.enrollments);
  }

  function retake(card: PlacedEnrollment) {
    const result = retakeEnrollment(enrollments, card.id, context);
    if (!result) return;
    onChange(result.enrollments, {
      title: `${card.course.name} agregado en ${getPeriodLabel(result.period)}`,
      isShownOnDesktop: true,
    });
  }

  function approvePassedPeriods(period: PeriodKey) {
    setIsAskingPassedPeriods(false);
    onChange(approveThroughPeriod(enrollments, period, context).enrollments);
  }

  function closePeriod(
    period: PeriodKey,
    statuses: Map<string, EnrollmentStatus>,
  ) {
    const result = setEnrollmentStatuses(enrollments, statuses, courses);
    setPeriodClosing({ period, isOpen: false });
    onChange(
      result.enrollments,
      getStatusNotice(
        `${getPeriodLabel(period)} cerrado`,
        result.revertedCount,
      ),
    );
  }

  function handleDragEnd({ operation, canceled }: DragEndEvent) {
    setDraggingId(null);
    useConnectionFocus.getState().setSuspended(false);
    markDragEnd();
    const card = base.cards.find((card) => card.id === operation.source?.id);
    if (!card) return;

    const { activatorEvent, transform } = operation;
    const isHoldWithoutMoving =
      activatorEvent instanceof PointerEvent &&
      activatorEvent.pointerType === "touch" &&
      !hasLeftStart(transform);
    if (isHoldWithoutMoving && !canceled) {
      openPanel(card);
      return;
    }

    const rect = operation.shape?.current.boundingRectangle;
    if (rect) keepDropOrigin(card.id, rect);
    const drop = getMove(operation);
    if (canceled || !drop) return;
    if (
      drop.placement.period === base.periods[card.column - 1] &&
      drop.placement.row === card.row
    )
      return;

    const result = moveEnrollment(
      enrollments,
      card.id,
      drop.placement,
      context,
    );
    if (result.error) {
      showEditError("No se puede mover el curso", result.error);
      return;
    }
    onChange(result.enrollments);
  }

  function handleAdd(placement: Placement, course: Course) {
    const result = addEnrollment(enrollments, course, placement, context);
    if (result.error) {
      showEditError("No se puede agregar el curso", result.error);
      return;
    }
    onChange(result.enrollments, { title: `${course.name} agregado` });
  }

  return (
    <DragDropProvider
      sensors={sensors}
      plugins={(defaults) => [
        ...defaults,
        Feedback.configure({ dropAnimation: null }),
      ]}
      onDragStart={({ operation }) => {
        markDragStart();
        setDraggingId(String(operation.source?.id));
        useConnectionFocus.getState().setSuspended(true);
      }}
      onDragEnd={handleDragEnd}
    >
      <div className="flex min-h-0 flex-1">
        <section
          ref={sectionRef}
          aria-label="Mi malla"
          className="min-h-0 min-w-0 flex-1 overflow-auto px-4 pt-4 pb-2 lg:px-8"
          style={
            isMobile && (isPanelOpen || draggingId !== null)
              ? { paddingBottom: PEEK_SNAP_POINT }
              : undefined
          }
        >
          <TrajectoryGrid
            base={base}
            nextPeriod={nextPeriod}
            gesturePeriods={gesturePeriods}
            enrollments={enrollments}
            entry={entry}
            curriculum={curriculum}
            progress={progress}
            selectedId={selectedId}
            draggingId={draggingId}
            isEntering={isEntering}
            isMobile={isMobile}
            isPanelOpen={isPanelOpen}
            firstCellRef={firstCellRef}
            getMove={getMove}
            takeDropOrigin={takeDropOrigin}
            getPeriodLabel={getPeriodLabel}
            hasPendingEnrollments={hasPendingEnrollments}
            onLeaveStart={() => setIsPanelOpen(false)}
            onSelectCard={selectCard}
            onAddAtPeriodEnd={addAtPeriodEnd}
            onAddAt={setAddPlacement}
            onClosePeriod={(period) =>
              setPeriodClosing({ period, isOpen: true })
            }
          />
        </section>
        <CoursePanel
          open={isPanelOpen && panelCard !== null}
          snapPoint={snapPoint}
          enrollment={panelCard?.enrollment ?? null}
          course={panelCard?.course ?? null}
          curriculum={curriculum}
          progress={progress}
          gradingScale={gradingScale}
          schemeSource={
            panelCard && getSchemeSource(panelCard, base, getPeriodLabel)
          }
          isAvailable={
            panelCard !== null && isAvailable(panelCard.course, progress)
          }
          canOpenCourse={(courseId) =>
            base.cards.some((card) => card.courseId === courseId)
          }
          onSnapPointChange={setSnapPoint}
          onOpenChange={setIsPanelOpen}
          onOpenCourse={(courseId) => {
            const card = base.cards
              .filter((card) => card.courseId === courseId)
              .at(-1);
            if (card) openPanel(card);
          }}
          onSetStatus={(status) => {
            if (!panelCard) return;
            const result = setEnrollmentStatus(
              enrollments,
              panelCard.id,
              status,
              courses,
            );
            onChange(
              result.enrollments,
              result.revertedCount > 0
                ? getStatusNotice(
                    `${panelCard.course.name} ${STATUS_LABELS[status]}`,
                    result.revertedCount,
                  )
                : undefined,
            );
          }}
          onGradesChange={(grades) => {
            if (!panelCard) return;
            onChange(
              enrollments.map((enrollment) =>
                enrollment.id === panelCard.id
                  ? { ...enrollment, ...grades }
                  : enrollment,
              ),
            );
          }}
          onRetake={
            panelCard?.enrollment.status === "FAILED" &&
            addableCourses.some((course) => course.id === panelCard.courseId)
              ? () => retake(panelCard)
              : null
          }
          onMove={() => setIsMoveOpen(true)}
          onRemove={() => {
            if (!panelCard) return;
            setIsPanelOpen(false);
            onChange(removeEnrollment(enrollments, panelCard.id), {
              title: `${panelCard.course.name} quitado`,
            });
          }}
        />
      </div>
      <AddEnrollmentDialog
        placement={addPlacement}
        periodLabel={addPlacement ? getPeriodLabel(addPlacement.period) : ""}
        courses={addableCourses}
        onOpenChange={(open) => {
          if (!open) setAddPlacement(null);
        }}
        onAdd={handleAdd}
      />
      <MoveEnrollmentDialog
        open={isMoveOpen && panelCard !== null}
        courseName={panelCard?.course.name ?? ""}
        options={moveOptions}
        onOpenChange={setIsMoveOpen}
        onMove={(period) => {
          if (panelCard) moveTo(panelCard, period);
        }}
      />
      <ClosePeriodDialog
        open={periodClosing?.isOpen ?? false}
        periodLabel={periodClosing ? getPeriodLabel(periodClosing.period) : ""}
        enrollments={closingEnrollments}
        onOpenChange={(open) => {
          if (periodClosing)
            setPeriodClosing({ ...periodClosing, isOpen: open });
        }}
        onClose={(statuses) => {
          if (periodClosing) closePeriod(periodClosing.period, statuses);
        }}
      />
      <PassedPeriodsDialog
        open={isAskingPassedPeriods && passedPeriodOptions.length > 0}
        options={passedPeriodOptions}
        getApprovedCount={(period) =>
          approveThroughPeriod(enrollments, period, context).approvedCount
        }
        onOpenChange={setIsAskingPassedPeriods}
        onApprove={approvePassedPeriods}
      />
    </DragDropProvider>
  );
}
