import { useEffect } from "react";

type Shortcut = {
  keys: string[];
  handler: () => void;
};

const useShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      shortcuts.forEach(({ keys, handler }) => {
        const ctrlPressed = keys.includes("Control")
          ? e.ctrlKey || e.metaKey
          : true;
        const shiftPressed = keys.includes("Shift") ? e.shiftKey : true;

        const allKeysPressed =
          keys
            .filter((k) => k !== "Control" && k !== "Shift" && k !== "Meta")
            .every((key) => e.key === key) &&
          ctrlPressed &&
          shiftPressed;

        if (allKeysPressed) {
          e.preventDefault();
          handler();
        }
      });
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [shortcuts]);
};

export default useShortcuts;
