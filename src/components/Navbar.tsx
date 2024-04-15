"use client";

import Link from "next/link";
import { Kanban, SquareKanban } from "lucide-react";

//import { useSession } from "next-auth/react";

export default function Navbar() {
  //const { data: session } = useSession();
  /*   const career = useCurriculumStore((state) => state?.curriculum?.career); */

  return (
    <header className="container z-40">
      <div className="flex h-20 items-center justify-between py-6">
        <div className="flex gap-6 md:gap-10">
          <Link
            className="flex flex-row items-center justify-center space-x-2"
            href="/"
          >
            <Kanban className="size-6" />
            <span className="hidden text-lg font-bold sm:inline-block">
              Mi Malla
            </span>
          </Link>
        </div>
        {/* <nav></nav> */}
      </div>
    </header>
  );
}
