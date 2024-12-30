import { arabicToRoman } from "@/utils/numbers";
import { forwardRef } from "react";

type PeriodContainerProps = {
  index: number;
  children?: React.ReactNode;
};

const PeriodContainer = forwardRef<HTMLUListElement, PeriodContainerProps>(
  ({ index, children, ...props }, ref) => {
    return (
      <ol className="flex select-none flex-col gap-2">
        <h3
          className={`text-center text-xs font-bold tracking-wider text-muted-foreground`}
        >
          SEMESTRE {arabicToRoman(index + 1)}
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
