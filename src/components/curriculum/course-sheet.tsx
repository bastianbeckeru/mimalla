import { CurriculumData, ModifiedCourse } from "@/types/curriculum";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

type CourseSheetProps = {
  isOpen: boolean;
  onOpenChange: () => void;
  course: {
    id: number;
    isElective: boolean;
    name: string;
    code: string | null;
    description: string | null;
    duration: number;
    credits: number;
    prerequisiteCredits: number;
    prerequisiteIds: number[];
    subsequentIds: number[];
  };
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
  const alternatives = course?.isElective
    ? getEligibleCourses(areas, courses, course.id)
    : [];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="min-h-64">
        <SheetHeader>
          <SheetTitle>{course?.name}</SheetTitle>
          <SheetDescription>{course?.description}</SheetDescription>
        </SheetHeader>
        {alternatives.map((alternative) => (
          <p key={alternative.id}>
            <span>{alternative.name}</span>
          </p>
        ))}
      </SheetContent>
    </Sheet>
  );
}

function getEligibleCourses(
  areas: CurriculumData["areas"],
  courses: Map<number, CurriculumData["courses"][0]>,
  electiveId: number,
) {
  const electiveAreas = areas.filter((area) =>
    area.courseIds.includes(electiveId),
  );

  const electiveCourses = electiveAreas
    .flatMap((area) => area.courseIds.map((id) => courses.get(id)))
    .filter((course) => course !== undefined);

  // Debería excluirse el mismo?
  return electiveCourses.filter((course) => course.id !== electiveId);
}
