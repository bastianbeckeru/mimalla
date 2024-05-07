"use client";

import { type ReactNode } from "react";
import { MotionLi, type VariantProps } from "../Motion";

type Props = {
  variants: VariantProps;
  period: {
    id: number;
    index: number;
    coursesAmount: number;
  };
  children: ReactNode;
};

export default function Period({ variants, period, children }: Props) {
  return (
    <>
      <MotionLi
        variants={variants}
        className={`
    } w-[8.5rem] shrink-0 pb-4`}
      >
        <div className="mx-1 flex select-none flex-col">
          <div className="z-10 flex items-center justify-center">
            <span className="-mb-[0.375rem] flex size-6 items-center justify-center rounded-full bg-slate-100 font-bold dark:bg-zinc-800">
              {period.index + 1}
            </span>
          </div>

          <div className="relative flex h-7 rounded-sm bg-zinc-800 shadow-md dark:bg-zinc-100">
            <span
              className={`flex h-full w-full items-center justify-center text-center font-bold text-white dark:text-black`}
            >
              Semestre
            </span>
          </div>
        </div>
        {children}
      </MotionLi>
    </>
  );
}
