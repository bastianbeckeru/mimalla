import {
  type ComponentProps,
  type CSSProperties,
  type PropsWithChildren,
  useRef,
} from "react";
import { Card, CardContent } from "../ui/card";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  className?: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
} & ComponentProps<"div"> &
  PropsWithChildren;

export default function SelectableCard({
  id,
  className,
  selectedId,
  onSelect,
  children,
  ...props
}: Props) {
  const touchTimeout = useRef<NodeJS.Timeout | null>(null);

  function handleTouchStart() {
    if (selectedId === id) return;
    touchTimeout.current = setTimeout(() => onSelect(id), 500);
  }

  function handleTouchEnd() {
    if (touchTimeout.current) clearTimeout(touchTimeout.current);
  }

  const isSelected = selectedId === id;

  return (
    <Card
      id={id}
      className={cn(
        "selectable-card",
        isSelected && "border-accent-foreground border-3",
        className,
      )}
      /* onFocus={() => onSelect(id)} */
      onMouseEnter={() => onSelect(id)}
      onMouseLeave={() => onSelect(null)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchEnd}
      onTouchEnd={handleTouchEnd}
      {...props}
    >
      <CardContent className="flex h-full items-center justify-center p-2">
        {children}
      </CardContent>
    </Card>
  );
}
