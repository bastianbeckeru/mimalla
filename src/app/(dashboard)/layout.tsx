import type { PropsWithChildren } from "react";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <>
      <main className="h-screen w-screen overflow-hidden">{children}</main>
    </>
  );
}

/*
 * flex-1 overflow-auto scroll-smooth
 */
