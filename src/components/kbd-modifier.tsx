import type { ReactNode } from "react";
import { Kbd } from "@/components/ui/kbd";

export default function KbdModifier({ children }: { children: ReactNode }) {
  return <Kbd>Ctrl{children}</Kbd>;
}
