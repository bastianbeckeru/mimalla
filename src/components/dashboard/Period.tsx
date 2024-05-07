"use client";

import { type ReactNode } from "react";
import { MotionLi, type VariantProps } from "../Motion";
import { Droppable } from "react-beautiful-dnd";
import { useSettingsStore } from "@/stores/curriculum";

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
  const { editMode } = useSettingsStore();

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
        <Droppable droppableId={period.id.toString()}>
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex h-min w-full flex-col overflow-hidden px-1 py-2"
            >
              {children}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </MotionLi>
    </>
  );
}
