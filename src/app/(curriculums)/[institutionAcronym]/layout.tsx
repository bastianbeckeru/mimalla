import type { PropsWithChildren } from "react";
import Navbar from "@/components/navbar";

export default function InstitutionLayout({ children }: PropsWithChildren) {
  return (
    <div className="grid min-h-dvh w-dvw grid-rows-[auto_1fr] lg:px-16">
      <Navbar />
      <main className="flex-1 overflow-hidden py-0 lg:py-4">{children}</main>
    </div>
  );
}
