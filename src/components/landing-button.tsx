"use client";

import { track } from "@vercel/analytics";
import { cn } from "cn";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useHasHydrated, useTrajectoryStore } from "@/stores/trajectory";

type LandingButtonProps = {
  label: string;
  source: string;
  className?: string;
};

const baseClassName =
  "inline-flex min-h-13 items-center gap-2 rounded-2xl bg-blue-600 px-7 font-semibold text-base text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2 [&_svg]:size-4";

export function LandingButton({
  label,
  source,
  className,
}: LandingButtonProps) {
  const hasHydrated = useHasHydrated();
  const hasTrajectories = useTrajectoryStore(
    (state) => state.trajectories.length > 0,
  );

  if (hasHydrated && hasTrajectories) {
    return (
      <Link
        href="/dashboard"
        className={cn(baseClassName, className)}
        onClick={() => {
          track("redirect_dashboard", { source });
        }}
      >
        Ir a mi malla
        <ArrowRight />
      </Link>
    );
  }

  return (
    <a href="#carreras" className={cn(baseClassName, className)}>
      {label}
    </a>
  );
}
