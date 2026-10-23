import { cn } from "cn";
import { animate, useMotionValue, useTransform } from "motion/react";
import { memo, useRef } from "react";
import { MotionDiv } from "@/components/motion";
import { CardContent } from "@/components/ui/card";
import { useInteractions } from "@/hooks/use-interactions";
import type { ExtendedSlot } from "@/types/curriculum";
import { checkContrasts } from "@/utils/colors";

const ITEM_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

type CourseCardProps = {
  index: number;
  slot: ExtendedSlot;
  isSelected: boolean;
  isNotRelated: boolean;
  handleClick: (newSlot: ExtendedSlot) => void;
  handleSelect: (newSlot: ExtendedSlot | null) => void;
};

const CourseCard = memo(function CourseCard({
  index,
  slot,
  isSelected,
  isNotRelated,
  handleClick,
  handleSelect,
}: CourseCardProps) {
  const progress = useMotionValue(0);
  const scale = useTransform(progress, [0, 1], [1, 0.97]);
  const animation = useRef<ReturnType<typeof animate> | null>(null);

  const { course, color, x, y, w, h } = slot;

  const { hasLowBackgroundElementContrast, hasLowElementTextContrast } =
    checkContrasts({ elementColor: color });

  const handlers = useInteractions({
    onLongPress: () => completePress(),
    onHoverStart: () => handleSelect(slot),
    onHoverEnd: () => handleSelect(null),
    onClick: () => handleClick(slot),
  });

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
      variants={ITEM_VARIANTS}
      className={cn(
        "clickeable flex cursor-pointer select-none flex-col gap-6 rounded-md border border-transparent bg-card py-6 text-card-foreground shadow-sm transition-[filter]",
        hasLowBackgroundElementContrast && "border-foreground/50",
        hasLowElementTextContrast && "text-background",
        isSelected && "ring-2 ring-rose-500",
        isNotRelated && "brightness-[25%]",
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
    >
      <CardContent className="flex h-full items-center justify-center p-2">
        <h3 className="text-balance text-center font-medium text-xs">
          {course?.name ?? `Slot ${index + 1}`}
        </h3>
      </CardContent>
    </MotionDiv>
  );
});

export default CourseCard;
