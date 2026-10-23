"use client";

import { memo } from "react";
import Path from "@/components/curriculum/path";

export type PathData = {
  data: string;
  color?: string;
};

type PathsOverlayProps = {
  paths: PathData[];
};

const PathsOverlay = memo(({ paths }: PathsOverlayProps) => {
  if (paths.length === 0) return null;

  return (
    <svg className="absolute top-0 left-0 -z-50 size-full" aria-hidden="true">
      {paths.map((item) => (
        <Path key={item.data} path={item.data} color={item.color ?? "white"} />
      ))}
    </svg>
  );
});

PathsOverlay.displayName = "PathsOverlay";

export default PathsOverlay;
