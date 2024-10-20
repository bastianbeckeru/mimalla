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
}: PeriodContainerProps) {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div ref={setNodeRef} className="flex flex-col gap-2">
      <span
        className={`text-center text-xs font-bold tracking-wider text-muted-foreground`}
      >
        SEMESTRE {arabicToRoman(index + 1)}
      </span>

      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}
