import type { CurriculumData, ModifiedCourse } from "@/types/curriculum";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";

type CourseSheetProps = {
  isOpen: boolean;
  onOpenChange: () => void;
  course: ModifiedCourse;
  courses: Map<number, CurriculumData["courses"][0]>;
  areas: CurriculumData["areas"];
};

export default function CourseSheet({
  isOpen,
  onOpenChange,
  course,
  courses,
  areas,
}: CourseSheetProps) {
  if (!course) return null;

  const { parentArea, subareas } = getAreasWithCourses(
    areas,
    courses,
    course.id,
  );

  // if isElective return React.Node

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="min-h-64">
        <SheetHeader>
          <SheetTitle>{course?.name}</SheetTitle>
          <SheetDescription>{course?.description}</SheetDescription>
        </SheetHeader>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          {parentArea && parentArea.courses.length > 0 && (
            <div className="col-span-1 rounded-md border p-2">
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
            <div key={subarea.id} className="col-span-1 rounded-md border p-2">
              <h3 className="font-semibold">{subarea.name}</h3>
              <ul>
                {subarea.courses.map((alternative) => (
                  <li key={alternative.id} className="text-muted-foreground">
                    {alternative.name}
                  </li>
                ))}
              </ul>
            </div>
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
