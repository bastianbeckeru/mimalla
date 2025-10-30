import { cn } from "@/lib/utils";
import { Card, CardContent } from "../ui/card";
import { checkContrasts } from "@/utils/colors";
import { SlotExtended } from "@/utils/curriculum-grid";
import { useLongPress } from "@/hooks/use-long-press";
import { memo } from "react";
import { MotionDiv } from "../motion";

type CourseCard = {
  index: number;
  slot: SlotExtended;
  isSelected: boolean;
  isNotRelated: boolean;
  handleClick: (newSlot: SlotExtended) => void;
  handleSelect: (newSlot: SlotExtended | null) => void;
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

  const longPressHandlers = useLongPress(() => handleSelect(slot), {
    threshold: 700,
    onClick: () => handleClick(slot),
    onHover: () => handleSelect(slot),
    onHoverEnd: () => handleSelect(null),
    hoverDelay: 100,
  });

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <MotionDiv
      {...longPressHandlers}
      variants={itemVariants}
      className={cn(
        "bg-card text-card-foreground flex cursor-pointer flex-col gap-6 rounded-md border py-6 shadow-sm transition-[filter] select-none",
        hasLowBackgroundElementContrast && "border-foreground/50 border",
        hasLowElementTextContrast && "text-background",
        isSelected && "glow glow-hover",
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
