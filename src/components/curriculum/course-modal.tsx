"use client";

import type { ExtendedSlot } from "@/types/curriculum";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

import { getContrastingShade, parseHexColor } from "@/utils/colors";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useRef, useState } from "react";

type CourseDialogProps = {
  open: boolean;
  onOpenChange: () => void;
  slot: ExtendedSlot | null;
};

/* POSSIBLE NEW FEATURE AND CONTRIBUTION TO OPEN SOURCE
 *
 * Actualmente el Drawer (Vaul) no soporta un modal dinámico, para permitir o no la interacción
 * con el background del drawer. Se podría hacer un fork de Vault y apoyar con esta feature.
 * ¿Es necesaria y/o útil esta feature?
 *
 * const snapPoints = [0.2, 0.5, 1];
 * <Drawer ... snapPoints={snapPoints} fadeFromIndex={1} modal={snap !== snapPoints[0]} />
 *
 */

const snapPoints = [0.5, 1];

export default function CourseModal({
  open,
  onOpenChange,
  slot,
  ...props
}: CourseDialogProps) {
  const isMobile = useIsMobile();
  const lastValidSlot = useRef<ExtendedSlot | null>(null);
  const [snap, setSnap] = useState<string | number | null>(snapPoints[1]!);

  useEffect(() => {
    if (slot && slot.course) {
      setSnap(snapPoints[1]!);
      lastValidSlot.current = slot;
    }
  }, [slot]);

  const displaySlot = slot?.course ? slot : lastValidSlot.current;
  if (!displaySlot || !displaySlot.course) return null;

  const { course, color } = displaySlot;
  const complementaryColor = getContrastingShade(parseHexColor(color));

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={snapPoints}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
        fadeFromIndex={1}
        //modal={false}
        {...props}
      >
        <DrawerContent className="h-full">
          <DrawerHeader>
            <DrawerTitle>{course.name}</DrawerTitle>
            <div className="text-muted-foreground mt-1 mb-2 flex flex-row items-center space-x-2 text-sm">
              {course.code && (
                <p
                  className="min-w-fit rounded-sm px-2 py-px font-medium"
                  style={{
                    backgroundColor: color,
                    color: complementaryColor,
                  }}
                >
                  {course.code}
                </p>
              )}
              <p className="min-w-fit rounded-md py-px">
                {course.credits} créditos
              </p>
            </div>
            <DrawerDescription>{course.description}</DrawerDescription>
          </DrawerHeader>

          <ul>
            <h4></h4>
            {course.subsequentIds.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course.name}</DialogTitle>
          <div className="text-muted-foreground mt-1 flex flex-row items-center space-x-2 text-sm">
            {course.code && (
              <p
                className="min-w-fit rounded-sm px-2 py-px font-medium"
                style={{
                  backgroundColor: color,
                  color: complementaryColor,
                }}
              >
                {course.code}
              </p>
            )}
            <p className="min-w-fit rounded-md py-px">
              {course.credits} créditos
            </p>
          </div>
          <DialogDescription>{course.description}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
