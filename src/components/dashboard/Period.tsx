"use client";

import { type ReactNode } from "react";
import { MotionLi, type VariantProps } from "../Motion";
import { arabicToRoman } from "@/utils/numbers";

type Props = {
  variants: VariantProps;
  index: number;
  children: ReactNode;
};

export default function Period({ variants, index, children }: Props) {
  return (
    <>
      <MotionLi
        variants={variants}
        className={`} w-[8rem] shrink-0 space-y-2 xl:w-[8.5rem]`}
      >
        <div className="flex w-full select-none items-center justify-center">
          <span
            className={`text-xs font-bold tracking-wider text-muted-foreground`}
          >
            SEMESTRE {arabicToRoman(index + 1)}
          </span>
        </div>
        {children}
      </MotionLi>
    </>
  );
}
