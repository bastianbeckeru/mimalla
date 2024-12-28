import type { PropsWithChildren } from "react";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <>
      <main className={`h-dvh w-dvw overflow-hidden`}>{children}</main>
    </>
  );
}

/*
 * flex-1 overflow-auto scroll-smooth
 */
