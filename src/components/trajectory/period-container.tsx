import type { DroppableProvidedProps } from "@hello-pangea/dnd";
import { cn } from "cn";
import type { ReactNode, Ref } from "react";
import { MotionDiv, MotionUl } from "@/components/motion";
import type { PeriodKey } from "@/types/curriculum";
import type { Entry } from "@/types/trajectory";
import { getPeriodInfo } from "@/utils/trajectory";

type PeriodContainerProps = DroppableProvidedProps & {
  id: PeriodKey;
  entry: Entry;
  ref: Ref<HTMLUListElement>;
  children: ReactNode;
};

export default function PeriodContainer({
  id,
  entry,
  ref,
  children,
  ...droppableProps
}: PeriodContainerProps) {
  const { label, isCurrent } = getPeriodInfo(id, entry);

  return (
    <MotionDiv
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
      className="flex min-w-32 select-none flex-col gap-2"
    >
      <h3
        className={cn(
          "text-center font-bold text-muted-foreground text-xs uppercase tracking-wider",
          isCurrent && "text-primary",
        )}
      >
        {label}
      </h3>

      <MotionUl
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        ref={ref}
        className="flex-grow"
        {...droppableProps}
      >
        {children}
      </MotionUl>
    </MotionDiv>
  );
}
