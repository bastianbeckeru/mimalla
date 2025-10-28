"use client";

import { useOperatingSystem } from "@/hooks/use-os";
import { Kbd } from "@/components/ui/kbd";

export default function KbdModifier({
  className,
  children,
  ...props
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { modifierKey } = useOperatingSystem();

  return (
    <Kbd className={className} {...props}>
      {modifierKey} {children}
    </Kbd>
  );
}
