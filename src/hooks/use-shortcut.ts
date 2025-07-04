import { useEffect } from "react";

type Shortcut = {
  keys: string[];
  handler: () => void;
};

const useShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const pressedKeys = new Set<string>();

    const handleKeydown = (e: KeyboardEvent) => {
      pressedKeys.add(e.key.toLowerCase());

      shortcuts.forEach(({ keys, handler }) => {
        const normalizedKeys = keys.map((k) => k.toLowerCase());

        const allKeysPressed = normalizedKeys.every((k) => {
          if (k === "control") return e.ctrlKey || pressedKeys.has("control");
          if (k === "shift") return e.shiftKey || pressedKeys.has("shift");
          if (k === "meta") return e.metaKey || pressedKeys.has("meta");
          return pressedKeys.has(k);
        });

        if (allKeysPressed) {
          e.preventDefault();
          handler();
        }
      });
    };

    const handleKeyup = (e: KeyboardEvent) => {
      pressedKeys.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeydown);
    window.addEventListener("keyup", handleKeyup);

    return () => {
      window.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("keyup", handleKeyup);
    };
  }, [shortcuts]);
};

export default useShortcuts;
