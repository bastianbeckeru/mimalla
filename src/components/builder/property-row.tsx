import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Shared look for the inline controls of a property row. */
export const propertyControlClassName =
  "h-7 border-transparent bg-transparent shadow-none hover:bg-muted/60 focus-visible:bg-transparent dark:bg-transparent dark:hover:bg-muted/60";

export default function PropertyRow({
  icon: Icon,
  label,
  htmlFor,
  children,
}: {
  icon: LucideIcon;
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-9 items-center gap-3 rounded-md px-2">
      <label
        htmlFor={htmlFor}
        className="flex w-24 shrink-0 items-center gap-2 text-muted-foreground text-sm"
      >
        <Icon className="size-4 shrink-0" />
        {label}
      </label>
      <div className="flex min-w-0 flex-1 items-center">{children}</div>
    </div>
  );
}
