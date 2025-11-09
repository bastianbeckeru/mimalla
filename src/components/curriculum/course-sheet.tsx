import type { Area, Course, CurriculumData } from "@/types/curriculum";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";

type CourseSheetProps = {
  isOpen: boolean;
  onOpenChange: () => void;
  course: Course;
  courses: Map<number, Course>;
  areas: Area[];
};

export default function CourseSheet2({
  isOpen,
  onOpenChange,
  course,
  courses,
  areas,
}: CourseSheetProps) {
  const isMobile = useIsMobile();

  if (!course) return null;

  const { parentArea, subareas } = getAreasWithCourses(
    areas,
    courses,
    course.id,
  );

  // if isElective return React.Node

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side={isMobile ? "left" : "bottom"} className="min-h-64">
        <SheetHeader>
          <SheetTitle>{course?.name}</SheetTitle>
          <SheetDescription>{course?.description}</SheetDescription>
        </SheetHeader>

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
      </SheetContent>
    </Sheet>
  );
}

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
