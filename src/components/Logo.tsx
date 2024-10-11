"use client";

import { cn } from "@/lib/utils";
import { Kanban } from "lucide-react";
import Link from "next/link";

export default function Logo({ alwaysShow = false }) {
  return (
    <Link href="/" className="flex flex-row items-center gap-2 px-2">
      <Kanban className="size-6" />
      <span
        className={cn(
          "hidden text-lg font-medium sm:inline-block",
          alwaysShow && "inline-block",
        )}
      >
        Mi Malla
      </span>
    </Link>
  );
}
