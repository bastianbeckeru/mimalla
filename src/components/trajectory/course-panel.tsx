"use client";

import { cn } from "cn";
import { type ComponentProps, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import CoursePanelContent from "@/components/trajectory/course-panel-content";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerVirtualKeyboardProvider,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Course } from "@/types/curriculum";
import type { Enrollment } from "@/types/trajectory";

export type PanelSnapPoint = number | string | null;

const PEEK_HEIGHT_REM = 8;

export const PEEK_SNAP_POINT = `${PEEK_HEIGHT_REM}rem`;
export const FULL_SNAP_POINT = 1;
const SNAP_POINTS = [PEEK_SNAP_POINT, FULL_SNAP_POINT];

export function getPeekHeight() {
  const rootFontSize = Number.parseFloat(
    getComputedStyle(document.documentElement).fontSize,
  );
  return PEEK_HEIGHT_REM * rootFontSize;
}

export default function CoursePanel({
  open,
  snapPoint,
  enrollment,
  course,
  onSnapPointChange,
  onOpenChange,
  ...props
}: Omit<
  ComponentProps<typeof CoursePanelContent>,
  | "enrollment"
  | "course"
  | "onClose"
  | "isDrawer"
  | "isPeek"
  | "Title"
  | "Description"
> & {
  open: boolean;
  snapPoint: PanelSnapPoint;
  enrollment: Enrollment | null;
  course: Course | null;
  onSnapPointChange: (snapPoint: PanelSnapPoint) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const isMobile = useIsMobile();
  const panelContentProps =
    enrollment && course
      ? {
          ...props,
          enrollment,
          course,
          onClose: () => onOpenChange(false),
        }
      : null;

  if (isMobile)
    return (
      <CourseDrawer
        open={open}
        snapPoint={snapPoint}
        onSnapPointChange={onSnapPointChange}
        onOpenChange={onOpenChange}
      >
        {panelContentProps && (
          <CoursePanelContent
            key={panelContentProps.enrollment.id}
            {...panelContentProps}
            isDrawer
            isPeek={snapPoint === PEEK_SNAP_POINT}
            Title={DrawerTitle}
            Description={DrawerDescription}
          />
        )}
      </CourseDrawer>
    );

  return open && panelContentProps ? (
    <aside
      aria-label="Curso seleccionado"
      className="fade-in slide-in-from-right-2 flex w-96 shrink-0 animate-in flex-col overflow-hidden border-l bg-popover text-sm duration-200 ease-out motion-reduce:animate-none"
    >
      <CoursePanelContent
        key={panelContentProps.enrollment.id}
        {...panelContentProps}
        isDrawer={false}
        isPeek={false}
        Title="h2"
        Description="p"
      />
    </aside>
  ) : null;
}

function CourseDrawer({
  open,
  snapPoint,
  onSnapPointChange,
  onOpenChange,
  children,
}: {
  open: boolean;
  snapPoint: PanelSnapPoint;
  onSnapPointChange: (snapPoint: PanelSnapPoint) => void;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const popupRef = useRef<HTMLDivElement>(null);
  const isFull = open && snapPoint === FULL_SNAP_POINT;
  const isPeek = open && snapPoint === PEEK_SNAP_POINT;

  useEffect(() => {
    if (!isPeek) return;
    const { style } = document.documentElement;
    style.setProperty("--toast-inset", PEEK_SNAP_POINT);
    return () => {
      style.removeProperty("--toast-inset");
    };
  }, [isPeek]);

  return (
    <>
      <Drawer
        open={open}
        modal={isFull ? "trap-focus" : false}
        disablePointerDismissal
        snapPoints={SNAP_POINTS}
        snapPoint={snapPoint}
        onSnapPointChange={onSnapPointChange}
        onOpenChange={onOpenChange}
      >
        <DrawerVirtualKeyboardProvider>
          <DrawerContent
            ref={popupRef}
            initialFocus={popupRef}
            finalFocus={false}
            className="data-[swipe-axis=y]:[--drawer-content-max-height:calc(100dvh-3.5rem)]"
            onFocusCapture={(event) => {
              if (event.target instanceof HTMLInputElement)
                onSnapPointChange(FULL_SNAP_POINT);
            }}
          >
            <DrawerClose className="sr-only">Cerrar</DrawerClose>
            {children}
          </DrawerContent>
        </DrawerVirtualKeyboardProvider>
      </Drawer>
      {open &&
        createPortal(
          <button
            type="button"
            tabIndex={-1}
            aria-label="Reducir"
            className={cn(
              "fixed inset-0 z-40 bg-black/30 opacity-0 transition-[opacity,backdrop-filter] duration-300 ease-out",
              isFull
                ? "opacity-100 supports-backdrop-filter:backdrop-blur-sm"
                : "pointer-events-none",
            )}
            onClick={() => onSnapPointChange(PEEK_SNAP_POINT)}
          />,
          document.body,
        )}
    </>
  );
}
