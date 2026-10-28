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

export function LandingButton({
  label,
  source,
  className,
}: LandingButtonProps) {
  const hasHydrated = useHasHydrated();
  const hasTrajectories = useTrajectoryStore(
    (state) => state.trajectories.length > 0,
  );

  return (
    <Link
      href="/dashboard"
      className={cn(
        "inline-flex min-h-13 items-center gap-2 rounded-2xl bg-blue-600 px-7 font-semibold text-base text-white transition-colors hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-blue-400 focus-visible:outline-offset-2 [&_svg]:size-4",
        className,
      )}
      onClick={() => track("redirect_dashboard", { source })}
    >
      {hasHydrated && hasTrajectories ? "Ir a mi malla" : label}
      <ArrowRight />
    </Link>
  );
}
