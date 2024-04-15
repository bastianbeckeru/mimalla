import type { PropsWithChildren } from "react";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <>
      <main className="h-screen w-screen">{children}</main>
    </>
  );
}

/*
 * flex-1 overflow-auto scroll-smooth
 */
