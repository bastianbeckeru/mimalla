import type { DropResult } from "react-beautiful-dnd";
import type { TaskProps } from "./curriculum";
import type {
  AreaProps,
  CurriculumProps,
  ModifiedCurriculumProps,
} from "@/types/curriculum";

export type useCurriculumStoreProps = {
  reset: () => void;
  setTaskQueue: (newTaskQueue: TaskProps[]) => void;
  setData: (newData: {
    curriculum: CurriculumProps | ModifiedCurriculumProps | undefined;
    areas: AreaProps[];
  }) => void;

  /* ENROLLMENTS */
  updateEnrollment: (updatedEnrollment: {
    id: number;
    position: number;
    status: string;
    course: {
      code?: string | null;
      credits: number;
      dependentCourses?: {
        code: string | null;
      }[];
    };
  }) => void;

  onDragEnd: (result: DropResult) => void;
} & StateProps;

export type StateProps = {
  curriculum: ModifiedCurriculumProps | undefined;
  areas: AreaProps[];
  taskQueue: TaskProps[];
  progress: {
    approvedCourses: string[];
    earnedCredits: number;
  };
};
