import type { PropsWithChildren } from "react";
import Navbar from "@/components/navbar";

export default function InstitutionLayout({ children }: PropsWithChildren) {
  return (
    <div className="grid h-dvh w-dvw grid-rows-[auto_1fr] lg:px-16">
      <Navbar />
      <main className="min-h-0 overflow-hidden pb-0 lg:pb-4">{children}</main>
    </div>
  );
}
