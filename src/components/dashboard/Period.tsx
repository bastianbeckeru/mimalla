"use client";

import { type ReactNode } from "react";
import { MotionLi, type VariantProps } from "../Motion";
import { Droppable } from "react-beautiful-dnd";
import { useSettingsStore } from "@/stores/curriculum";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import CourseForm from "./CourseForm";
import { cn } from "@/lib/utils";

type Props = {
  variants: VariantProps;
  index: number;
  coursesAmount: number;
  children: ReactNode;
};

export default function Period({
  variants,
  index,
  coursesAmount,
  children,
}: Props) {
  const { editMode } = useSettingsStore();

  return (
    <>
      <MotionLi
        variants={variants}
        className={`
    } w-[8.5rem] shrink-0 overflow-hidden pb-4`}
      >
        <div className="mx-1 flex select-none flex-col">
          <div className="z-10 flex items-center justify-center">
            <span className="-mb-[0.375rem] flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 font-bold dark:bg-zinc-800">
              {index + 1}
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
        <Droppable droppableId={index.toString()}>
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="flex h-min w-full flex-col px-1 py-2"
            >
              {children}
              {provided.placeholder}

              <li
                className={cn(
                  "h-7",
                  editMode && coursesAmount < 10 ? "flex" : "hidden",
                  "hidden",
                )}
              >
                <Dialog>
                  <DialogTrigger
                    aria-label="agrega un nuevo curso"
                    className="flex size-full items-center justify-center rounded-2xl border border-foreground/5 bg-foreground/5 shadow-md transition-colors hover:bg-foreground/10"
                  >
                    <Plus className="size-4 text-white" />
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Añadir Curso</DialogTitle>
                    </DialogHeader>
                    <div>
                      <CourseForm pId={0} pIndex={index} />
                    </div>
                  </DialogContent>
                </Dialog>
              </li>
            </ul>
          )}
        </Droppable>
      </MotionLi>
    </>
  );
}
