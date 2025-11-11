"use client";

import type { Course, ExtendedCourse, ExtendedSlot } from "@/types/curriculum";

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
import { Badge } from "../ui/badge";
import { ArrowDownCircle, Lock, Unlock } from "lucide-react";

type CourseDialogProps = {
  open: boolean;
  onOpenChange: () => void;
  slot: ExtendedSlot | null;
  //course: ExtendedCourse;
  courses: Map<string | number, Course>;
  //areas:  Map<string | number, Area>;
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
  courses,
  ...props
}: CourseDialogProps) {
  const isMobile = useIsMobile();
  const lastValidSlot = useRef<ExtendedSlot | null>(null);
  const [snap, setSnap] = useState<string | number | null>(snapPoints[1]!);

  useEffect(() => {
    if (slot && slot.course) {
      setSnap(snapPoints[0]!);
      lastValidSlot.current = slot;
    }
  }, [slot]);

  const displaySlot = slot?.course ? slot : lastValidSlot.current;
  if (!displaySlot || !displaySlot.course) return null;

  // Probablemente lo más lógico es recibir únicamente el curso, no el slot completo.
  // De esta manera si por alguna razón se abre el mismo curso, no se reabre el modal, sino que se mantiene.
  const { course, color } = displaySlot;
  const complementaryColor = getContrastingShade(parseHexColor(color));

  const prerequisiteCourses = course.prerequisiteIds
    .map((id) => courses.get(id))
    .filter((c): c is Course => c !== undefined);

  const subsequentCourses = course.subsequentIds
    .map((id) => courses.get(id))
    .filter((c): c is Course => c !== undefined);

  if (isMobile) {
    return (
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        snapPoints={snapPoints}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}
        {...props}
      >
        <DrawerContent className="h-full">
          <DrawerHeader>
            <DrawerTitle>{course.name}</DrawerTitle>
            <DrawerDescription>
              <div className="flex items-center gap-2">
                {course.code && (
                  <Badge
                    className="uppercase"
                    style={{
                      backgroundColor: color,
                      color: complementaryColor,
                    }}
                  >
                    {course.code}
                  </Badge>
                )}
                <span>{course.credits} créditos</span>
              </div>
              <p>{course.description}</p>
            </DrawerDescription>
          </DrawerHeader>

          {/* CURSOS RELACIONADOS */}
          <div className="space-y-4 px-4 py-2">
            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2">
                <Lock className="size-4 shrink-0" />
                <h4 className="text-xs font-bold tracking-wide uppercase">
                  Requiere
                </h4>
              </div>
              {prerequisiteCourses.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {prerequisiteCourses.map((relatedCourse) => (
                    <li key={relatedCourse.id}>
                      <Badge variant="secondary" className="rounded-sm">
                        {relatedCourse.name}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">Ninguno</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-muted-foreground flex items-center gap-2">
                <Unlock className="size-4 shrink-0" />
                <h4 className="text-xs font-bold tracking-wide uppercase">
                  Desbloquea
                </h4>
              </div>
              {subsequentCourses.length > 0 ? (
                <ul className="flex flex-wrap gap-2">
                  {subsequentCourses.map((relatedCourse) => (
                    <li key={relatedCourse.id}>
                      <Badge variant="secondary" className="rounded-sm">
                        {relatedCourse.name}
                      </Badge>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">Ninguno</p>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course.name}</DialogTitle>
          <DialogDescription>
            <div className="flex items-center gap-2">
              {course.code && (
                <Badge
                  className="uppercase"
                  style={{
                    backgroundColor: color,
                    color: complementaryColor,
                  }}
                >
                  {course.code}
                </Badge>
              )}
              <span>{course.credits} créditos</span>
            </div>
            <p>{course.description}</p>
          </DialogDescription>
        </DialogHeader>

        {/* CURSOS RELACIONADOS */}
        <div className="space-y-4 px-0 py-2">
          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-2">
              <Lock className="size-4 shrink-0" />
              <h4 className="text-xs font-bold tracking-wide uppercase">
                Requiere
              </h4>
            </div>
            {prerequisiteCourses.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {prerequisiteCourses.map((relatedCourse) => (
                  <li key={relatedCourse.id}>
                    <Badge variant="secondary" className="rounded-sm">
                      {relatedCourse.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">Ninguno</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-muted-foreground flex items-center gap-2">
              <Unlock className="size-4 shrink-0" />
              <h4 className="text-xs font-bold tracking-wide uppercase">
                Desbloquea
              </h4>
            </div>
            {subsequentCourses.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {subsequentCourses.map((relatedCourse) => (
                  <li key={relatedCourse.id}>
                    <Badge variant="secondary" className="rounded-sm">
                      {relatedCourse.name}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">Ninguno</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
