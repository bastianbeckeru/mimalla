import type { PropsWithChildren } from "react";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return <main className="h-dvh w-dvw overflow-hidden">{children}</main>;
}
