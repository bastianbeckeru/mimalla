import { MotionOl } from "@/components/Motion";
import type { PeriodKey } from "@/types/curriculum";
import { arabicToRoman } from "@/utils/numbers";
import { useDroppable } from "@dnd-kit/core";

type PeriodContainerProps = {
  id: PeriodKey;
  index: number;
  children?: React.ReactNode;
};

export default function PeriodContainer({
  id,
  index,
  children,
  ...props
}: PeriodContainerProps) {
  const { setNodeRef } = useDroppable({
    id: id,
    data: {
      type: "container",
    },
  });

  const variants = {
    hidden: {
      opacity: 0,
      transition: {
        when: "afterChildren",
      },
    },
    visible: (i: number) => ({
      opacity: 1,
      transition: {
        delay: i * 0.025,
        when: "beforeChildren",
        staggerChildren: 0.025,
      },
    }),
  };

  return (
    <MotionOl
      initial="hidden"
      animate="visible"
      variants={variants}
      custom={index}
      ref={setNodeRef}
      className="z-0 flex select-none flex-col gap-2 px-1"
      {...props}
    >
      <span
        className={`text-center text-xs font-bold tracking-wider text-muted-foreground`}
      >
        SEMESTRE {arabicToRoman(index + 1)}
      </span>

      {/* <div className="flex flex-col gap-2">{children}</div> */}
      {children}
    </MotionOl>
  );
}
