import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { checkContrasts } from "@/utils/colors";
import useInteractions from "@/hooks/use-long-press";
import { memo, useRef } from "react";
import { MotionDiv } from "../motion";
import { ExtendedSlot } from "@/types/curriculum";
import { animate, useMotionValue, useTransform } from "motion/react";

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
  const progress = useMotionValue(0);
  const scale = useTransform(progress, [0, 1], [1, 0.97]);
  const animation = useRef<any>(null);

  const { course, color, x, y, w, h } = slot;

  const { hasLowBackgroundElementContrast, hasLowElementTextContrast } =
    checkContrasts({ elementColor: color });

  const handlers = useInteractions({
    onLongPress: () => completePress(),
    onHoverStart: () => handleSelect(slot),
    onHoverEnd: () => handleSelect(null),
    onClick: () => handleClick(slot),
  });

  const itemVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const startPress = () => {
    if (isSelected) return;
    animation.current = animate(progress, 1, { duration: 0.7 });
  };

  const endPress = () => {
    animation.current?.stop();
    animate(progress, 0, { duration: 0.15 });
  };

  const completePress = () => {
    animate(progress, 0, { duration: 0.2 });
    handleSelect(slot);
  };

  return (
    <MotionDiv
      {...handlers}
      variants={itemVariants}
      className={cn(
        "bg-card clickeable text-card-foreground flex cursor-pointer flex-col gap-6 rounded-md border border-transparent py-6 shadow-sm transition-[filter] select-none",
        hasLowBackgroundElementContrast && "border-foreground/50",
        hasLowElementTextContrast && "text-background",
        isSelected && "ring-2 ring-rose-500",
        isNotRelated && "brightness-[25%]",
        className,
      )}
      style={{
        backgroundColor: color,
        gridColumn: `${x} / span ${w}`,
        gridRow: `${y} / span ${h}`,
        scale: isSelected ? 1 : scale,
      }}
      onPointerDown={(e) => {
        startPress();
        handlers.onPointerDown(e);
      }}
      onPointerUp={endPress}
      onPointerLeave={(e) => {
        endPress();
        handlers.onPointerLeave(e);
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
