import type { ReactNode } from "react";

export const ROW_CLASS = "flex items-center justify-between gap-4 px-3 py-2.5";
export const LINK_ROW_CLASS = `${ROW_CLASS} outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50`;

export function SettingsGroup({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div>
        <h3 className="font-heading text-sm font-semibold">{title}</h3>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </div>
      <div className="divide-y overflow-hidden rounded-lg border">
        {children}
      </div>
    </section>
  );
}

export function RowText({
  label,
  description,
}: {
  label: string;
  description?: string;
}) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-sm font-medium">{label}</p>
      {description && (
        <p className="text-muted-foreground text-xs">{description}</p>
      )}
    </div>
  );
}
