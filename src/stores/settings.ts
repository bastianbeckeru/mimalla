import { create } from "zustand";

/* SETTINGS STORE */
export const useSettingsStore = create<useSettingsStoreProps>((set) => ({
  editMode: false,
  setEditMode: (newState) => set((state) => ({ ...state, editMode: newState })),
}));

/* TYPES */
type useSettingsStoreProps = {
  editMode: boolean;
  setEditMode: (newState: boolean) => void;
};
