import { cn } from "cn";
import { Plus } from "lucide-react";
import type { CSSProperties } from "react";

export default function AddButton({
  label,
  revealOnHover = false,
  style,
  onClick,
}: {
  label: string;
  revealOnHover?: boolean;
  style: CSSProperties;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "group flex items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground transition-[background-color,border-color,color] duration-150 ease-out hover:border-border hover:bg-muted/40 hover:text-foreground focus-visible:border-border focus-visible:bg-muted/40 focus-visible:text-foreground focus-visible:outline-none active:bg-muted/60",
        revealOnHover ? "border-transparent" : "border-border",
      )}
      style={style}
      onClick={onClick}
    >
      <Plus
        className={cn(
          "size-4 transition-opacity duration-150 ease-out group-hover:opacity-100 group-focus-visible:opacity-100",
          revealOnHover ? "opacity-0" : "opacity-50",
        )}
      />
    </button>
  );
}
