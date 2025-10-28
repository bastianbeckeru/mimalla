"use client";

import { Kbd } from "@/components/ui/kbd";

export default function KbdModifier({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const isApple = (
    navigator.userAgent || // preferido
    navigator.platform || // fallback
    ""
  )
    .toUpperCase()
    .includes("MAC");

  const modifierKey = isApple ? "⌘" : "Ctrl";

  return (
    <Kbd className={className} {...props}>
      {modifierKey} {children}
    </Kbd>
  );
}
