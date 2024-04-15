import { Montserrat } from "next/font/google";
import type { PropsWithChildren } from "react";

const mont = Montserrat({
  subsets: ["latin"],
});

export default async function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <>
      <main
        className={`h-screen w-screen overflow-hidden font-sans ${mont.className}`}
      >
        {children}
      </main>
    </>
  );
}

/*
 * flex-1 overflow-auto scroll-smooth
 */
