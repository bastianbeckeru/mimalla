import type { PeriodKey } from "@/types/curriculum";
import { getPeriodInfo } from "@/utils/curriculum";
import { forwardRef } from "react";

type PeriodContainerProps = {
  id: PeriodKey;
  children?: React.ReactNode;
};

const PeriodContainer = forwardRef<HTMLUListElement, PeriodContainerProps>(
  ({ id, children, ...props }, ref) => {
    const { label, isCurrent } = getPeriodInfo(id);

    return (
      <ol className="flex min-w-32 select-none flex-col gap-2">
        <h3
          className={`text-center text-xs font-bold tracking-wider text-muted-foreground ${isCurrent && "font-extrabold text-primary"}`}
        >
          {label}
        </h3>

        <ul {...props} ref={ref} className="flex-grow">
          {children}
        </ul>
      </ol>
    );
  },
);
PeriodContainer.displayName = "PeriodContainer";

export default PeriodContainer;
