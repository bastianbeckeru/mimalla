"use client";

import { Check, GitFork } from "lucide-react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Course } from "@/types/builder";
import type { ExtendedCourse } from "@/types/curriculum";
import type { TrajectoryProgress } from "@/types/trajectory";
import { getContrastingShade, parseHexColor } from "@/utils/colors";

type CourseModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: ExtendedCourse | null;
  color: string;
  courses: Map<number, Course>;
  progress?: TrajectoryProgress;
};

type RelatedItem = {
  key: string | number;
  name: string;
  isApproved?: boolean;
};

export default function CourseModal({
  open,
  onOpenChange,
  course,
  color,
  courses,
  progress,
}: CourseModalProps) {
  if (!course) return null;

  const toRelatedItems = (ids: number[]) =>
    ids.flatMap((id): RelatedItem[] => {
      const related = courses.get(id);
      if (!related) return [];

      return [
        {
          key: id,
          name: related.name,
          isApproved: progress?.approvedCourseIds.has(id),
        },
      ];
    });

  const prerequisites = toRelatedItems(course.prerequisiteIds);
  if (course.prerequisiteCredits > 0) {
    prerequisites.unshift({
      key: "credits",
      name: `${course.prerequisiteCredits} créditos`,
      isApproved:
        progress && course.prerequisiteCredits <= progress.approvedCredits,
    });
  }

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={course.name}
      description={`Prerrequisitos y cursos que habilita ${course.name}.`}
      isDescriptionHidden
      headerExtra={
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          {course.code && (
            <Badge
              className="uppercase"
              style={{
                backgroundColor: color,
                color: getContrastingShade(parseHexColor(color)),
              }}
            >
              {course.code}
            </Badge>
          )}
          <span>{course.credits} créditos</span>
        </div>
      }
    >
      <Separator />

      <div className="space-y-4 py-2">
        <RelatedCourses
          title="Requiere"
          iconClassName="-rotate-90"
          items={prerequisites}
        />
        <RelatedCourses
          title="Habilita"
          iconClassName="rotate-90"
          items={toRelatedItems(course.successorIds)}
        />
      </div>
    </ResponsiveDialog>
  );
}

function RelatedCourses({
  title,
  iconClassName,
  items,
}: {
  title: string;
  iconClassName: string;
  items: RelatedItem[];
}) {
  return (
    <div className="space-y-2">
      <h4 className="inline-flex items-center gap-2 font-bold text-muted-foreground text-xs uppercase tracking-wide [&_svg]:size-4 [&_svg]:shrink-0">
        <GitFork className={iconClassName} />
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item.key}>
              <Badge variant="secondary" className="rounded-sm">
                {item.isApproved && <Check className="text-green-600" />}
                {item.name}
              </Badge>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">Ninguno</p>
      )}
    </div>
  );
}
