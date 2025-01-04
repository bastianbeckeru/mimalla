import type { PeriodKey } from "@/types/curriculum";
import { arabicToRoman } from "@/utils/numbers";
import { forwardRef } from "react";

type PeriodContainerProps = {
  id: PeriodKey;
  children?: React.ReactNode;
};

function getPeriodLabel(id: PeriodKey) {
  const [year, term] = id.split("-").map(Number);

  if (term === 2) return "INVIERNO";
  if (term === 4) return "VERANO";

  const a = 2 * year! - (term === 1 ? 1 : 0);
  return `SEMESTRE ${arabicToRoman(a)}`;
}

const PeriodContainer = forwardRef<HTMLUListElement, PeriodContainerProps>(
  ({ id, children, ...props }, ref) => {
    const periodLabel = getPeriodLabel(id);

    return (
      <ol className="flex min-w-32 select-none flex-col gap-2">
        <h3
          className={`text-center text-xs font-bold tracking-wider text-muted-foreground`}
        >
          {periodLabel}
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
