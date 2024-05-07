"use client";

import type { CurriculumProps } from "@/types/user";

import { DragDropContext } from "react-beautiful-dnd";
import { MotionOl } from "../Motion";
import Period from "./Period";
import Course from "./Course";
import { cn } from "@/lib/utils";
import { useCurriculumStore, useSettingsStore } from "@/stores/curriculum";
import { Plus } from "lucide-react";

type Props = {
  curriculum: CurriculumProps;
};

export default function Curriculum({ curriculum }: Props) {
  const { onDragEnd } = useCurriculumStore();
  const { editMode } = useSettingsStore();

  /* Animations */
  const variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06,
      },
    },
  };
  const periodVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };
  const courseVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <MotionOl
        variants={variants}
        initial="hidden"
        animate="visible"
        className="flex p-4"
      >
        {curriculum.periods.map((period, pIndex) => {
          return (
            <Period
              key={pIndex}
              variants={periodVariants}
              index={pIndex}
              coursesAmount={period.enrollments.length}
            >
              {period.enrollments.map((enrollment, eIndex) => {
                return (
                  <Course
                    key={eIndex}
                    variants={courseVariants}
                    index={eIndex}
                    enrollment={enrollment}
                  />
                );
              })}
            </Period>
          );
        })}

        {/* Add Semester Button */}
        <li
          className={cn(
            "mx-1 my-[1.125rem] h-7 w-36 shrink-0 items-center justify-center rounded-lg",
            editMode && curriculum.periods.length < 25 ? "flex" : "hidden",
            "hidden",
          )}
        >
          <button
            aria-label="agregar semestre"
            className="flex size-full items-center justify-center rounded-lg border border-foreground/5 bg-foreground/5 shadow-md transition-colors hover:bg-foreground/10"
            onClick={() => {
              console.log("Añadiendo periodo...");
            }}
          >
            <Plus className="size-4 text-white" />
          </button>
        </li>
      </MotionOl>
    </DragDropContext>
  );
}
