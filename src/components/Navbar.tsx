"use client";

import Link from "next/link";
import { Kanban } from "lucide-react";
import Logo from "./Logo";

//import { useSession } from "next-auth/react";

export default function Navbar() {
  //const { data: session } = useSession();

  return (
    <header className="container z-40">
      <div className="flex h-20 items-center justify-between py-6">
        <div className="flex gap-6 md:gap-10">
          <Logo />
        </div>
        {/* <nav></nav> */}
      </div>
    </header>
  );
}
