import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { checkContrasts } from "@/utils/colors";
import useInteractions from "@/hooks/use-long-press";
import { memo } from "react";
import { MotionDiv } from "../motion";
import { ExtendedSlot } from "@/types/curriculum";

type CourseCard = {
  index: number;
  slot: ExtendedSlot;
  isSelected: boolean;
  isNotRelated: boolean;
  handleClick: (newSlot: ExtendedSlot) => void;
  handleSelect: (newSlot: ExtendedSlot | null) => void;
  className?: string;
};

const CourseCard = memo(function CourseCard({
  index,
  slot,
  isSelected = false,
  isNotRelated = true,
  handleClick,
  handleSelect,
  className,
  ...props
}: CourseCard) {
  const { course, color, x, y, w, h } = slot;

  const { hasLowBackgroundElementContrast, hasLowElementTextContrast } =
    checkContrasts({ elementColor: color });

  const handlers = useInteractions({
    onLongPress: () => handleSelect(slot),
    onHoverStart: () => handleSelect(slot),
    onHoverEnd: () => handleSelect(null),
    onClick: () => handleClick(slot),
  });

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <MotionDiv
      {...handlers}
      variants={itemVariants}
      className={cn(
        "bg-card text-card-foreground flex cursor-pointer flex-col gap-6 rounded-md border py-6 shadow-sm transition-[filter] select-none",
        hasLowBackgroundElementContrast && "border-foreground/50 border",
        hasLowElementTextContrast && "text-background",
        isSelected && "glow glow-active",
        isNotRelated && "brightness-[25%]",
        className,
      )}
      style={{
        backgroundColor: color,
        gridColumn: `${x} / span ${w}`,
        gridRow: `${y} / span ${h}`,
      }}
      {...props}
    >
      <CardContent className="flex h-full items-center justify-center p-2">
        <h3 className="text-center text-xs font-medium text-balance">
          {course?.name ?? `Slot ${index + 1}`}
        </h3>
      </CardContent>
    </MotionDiv>
  );
});

export default CourseCard;
