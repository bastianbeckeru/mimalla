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
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowRight,
  CornerDownRight,
  CornerLeftDown,
  GitFork,
  Lock,
  Unlock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";

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

const snapPoints = [0.6, 1];

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
        fadeFromIndex={0}
        {...props}
      >
        <DrawerContent className="h-full px-4">
          <DrawerHeader className="">
            <DrawerTitle className="pb-1.5">{course.name}</DrawerTitle>
            <div className="text-muted-foreground space-y-3 text-sm">
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
              <DrawerDescription>{course.description}</DrawerDescription>
            </div>
          </DrawerHeader>

          <Separator className="my-2" />

          {/* CURSOS RELACIONADOS */}
          <RelatedCourses
            prerequisiteCourses={prerequisiteCourses}
            subsequentCourses={subsequentCourses}
          />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange} {...props}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course.name}</DialogTitle>
          <div className="text-muted-foreground space-y-3 text-sm">
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
            <DialogDescription>{course.description}</DialogDescription>
          </div>
        </DialogHeader>

        <Separator />

        <RelatedCourses
          prerequisiteCourses={prerequisiteCourses}
          subsequentCourses={subsequentCourses}
          className="px-0"
        />
      </DialogContent>
    </Dialog>
  );
}

type RelatedCoursesProps = {
  prerequisiteCourses: Course[];
  subsequentCourses: Course[];
  className?: string;
};

function RelatedCourses({
  prerequisiteCourses,
  subsequentCourses,
  className,
}: RelatedCoursesProps) {
  return (
    <div className={cn("space-y-4 py-2", className)}>
      <div className="space-y-2">
        <h4 className="text-muted-foreground inline-flex items-center gap-2 text-xs font-bold tracking-wide uppercase [&_svg]:size-4 [&_svg]:shrink-0">
          <GitFork className="-rotate-90" />
          Requiere
        </h4>
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
        <h4 className="text-muted-foreground inline-flex items-center gap-2 text-xs font-bold tracking-wide uppercase [&_svg]:size-4 [&_svg]:shrink-0">
          <GitFork className="rotate-90" />
          Habilita
        </h4>
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
  );
}

/*

   <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          {parentArea && parentArea.courses.length > 0 && (
            <div className="col-span-1 max-h-48 rounded-md border p-2">
              <ul>
                {parentArea.courses.map((alternative) => (
                  <li key={alternative.id} className="text-muted-foreground">
                    {alternative.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {subareas.map((subarea) => (
            <ScrollArea
              key={subarea.id}
              className="col-span-1 max-h-48 rounded-md border"
            >
              <div className="p-4">
                <h4 className="mb-4 text-sm leading-none font-medium">
                  {subarea.name}
                </h4>
                <ul>
                  {subarea.courses.map((alternative) => (
                    <li
                      key={alternative.id}
                      className="text-muted-foreground text-sm"
                    >
                      {alternative.name}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollArea>
          ))}
        </div>


        function getAreasWithCourses(
          areas: CurriculumData["areas"],
          courses: Map<number, CurriculumData["courses"][0]>,
          electiveId: number,
        ) {
          const parentArea = areas.filter((area) =>
            area.courseIds.includes(electiveId),
          )[0];
        
          if (!parentArea) return { parentArea: undefined, subareas: [] };
        
          const subareas = areas.filter((area) =>
            parentArea.subareaIds.includes(area.id),
          );
        
          const fixedSubareas = subareas.map((area) => {
            return {
              ...area,
              courses: area.courseIds
                .map((id) => courses.get(id))
                .filter((c) => c !== undefined),
            };
          });
        
          const fixedParentArea = {
            ...parentArea,
            courses: parentArea.courseIds
              .filter((id) => id !== electiveId)
              .map((id) => courses.get(id))
              .filter((c) => c !== undefined),
          };
        
          return { parentArea: fixedParentArea, subareas: fixedSubareas };
        }
        

*/
