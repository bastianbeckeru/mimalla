"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import Path from "./path";

export type PathData = {
  data: string;
  color?: string;
};

type PathsOverlayProps = {
  paths: PathData[];
  className?: string;
};

const PathsOverlay = memo(({ paths, className }: PathsOverlayProps) => {
  if (paths.length === 0) return null;

  return (
    <svg
      className={cn("absolute top-0 left-0 -z-50 size-full", className)}
      aria-hidden="true"
    >
      {paths.map((item, idx) => (
        <Path key={idx} path={item.data} color={item.color ?? "white"} />
      ))}
    </svg>
  );
});

PathsOverlay.displayName = "PathsOverlay";

export default PathsOverlay;
