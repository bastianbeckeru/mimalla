import { create } from "zustand";
import { persist } from "zustand/middleware";

type PreferencesStore = {
  showsAreasBar: boolean;
  setShowsAreasBar: (showsAreasBar: boolean) => void;
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set) => ({
      showsAreasBar: true,
      setShowsAreasBar: (showsAreasBar) => set({ showsAreasBar }),
    }),
    { name: "preferences-storage" },
  ),
);
