"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";
import Path from "./path";

export type PathData = {
  id: string;
  path: string;
  color: string;
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
      <defs>
        {/* Aquí puedes agregar definiciones reutilizables como gradientes */}
      </defs>
      {paths.map((item) => (
        <Path key={item.id} path={item.path} color={item.color} />
      ))}
    </svg>
  );
});

PathsOverlay.displayName = "PathsOverlay";

export default PathsOverlay;
