import { create } from "zustand";
import { persist } from "zustand/middleware";

/* SETTINGS STORE */
export const useSettingsStore = create(
  persist<useSettingsStoreProps>(
    (set) => ({
      showTimeline: false,
      setShowTimeline: (newState: boolean) => set({ showTimeline: newState }),
      autoRescheduleFailed: false,
      setRescheduleFailed: (newState: boolean) =>
        set({ autoRescheduleFailed: newState }),
    }),
    { name: "settings", version: 1 },
  ),
);

/* TYPES */
type useSettingsStoreProps = {
  showTimeline: boolean;
  autoRescheduleFailed: boolean;
  setShowTimeline: (newState: boolean) => void;
  setRescheduleFailed: (newState: boolean) => void;
};
