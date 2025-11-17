import { MotionOl, MotionUl } from "@/components/motion";
import type { PeriodKey } from "@/types/curriculum";
import { getPeriodInfo } from "@/utils/curriculum";
import { forwardRef, type PropsWithChildren } from "react";

type PeriodContainerProps = {
  id: PeriodKey;
  curriculumYear: number;
} & PropsWithChildren;

const columnVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const ulVariants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const PeriodContainer = forwardRef<HTMLUListElement, PeriodContainerProps>(
  ({ id, curriculumYear, children, ...props }, ref) => {
    const { label, isCurrent } = getPeriodInfo(id, curriculumYear);

    return (
      <MotionOl
        variants={columnVariants}
        className="flex min-w-32 flex-col gap-2 select-none"
      >
        <h3
          className={`text-muted-foreground text-center text-xs font-bold tracking-wider uppercase ${isCurrent && "text-primary"}`}
        >
          {label}
        </h3>

        <MotionUl
          variants={ulVariants}
          ref={ref}
          className="flex-grow"
          {...props}
        >
          {children}
        </MotionUl>
      </MotionOl>
    );
  },
);
PeriodContainer.displayName = "PeriodContainer";

export default PeriodContainer;
