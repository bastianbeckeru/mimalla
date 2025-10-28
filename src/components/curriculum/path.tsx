"use client";

import { memo } from "react";

type PathProps = {
  path: string;
  color: string;
  strokeWidth?: number;
};

const Path = memo(({ path, color, strokeWidth = 1.5 }: PathProps) => {
  return (
    <path
      d={path}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-dash"
    />
  );
});

Path.displayName = "Path";

export default Path;
