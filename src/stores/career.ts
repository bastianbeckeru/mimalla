import { create } from "zustand";

/* AREAS STORE */
/* TYPES */
type useCareerProps = {
  setAreas: (newAreas: AreaProps[]) => void;
} & StateProps;

type StateProps = {
  areas: AreaProps[];
};

const initialState: StateProps = {
  areas: [],
};

export const useCareerStore = create<useCareerProps>((set) => ({
  ...initialState,

  setAreas: (newAreas) =>
    set(() => {
      return { areas: newAreas };
    }),
}));

type AreaProps = {
  id: number;
  localId: string;
  name: string;
  backgroundColor: string; // "#FFFFFF"
  textColor: boolean;
  courses: CourseProps[];
};

type CourseProps = {
  id: number;
  code: string | null;
  name: string;
  credits: number;
  description: string | null;
  // Dependecy System
  requiredCredits: number;
  requiredCourses: string[];
  //
  //professors:      ProfessorCourse?
};
