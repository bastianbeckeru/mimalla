import { useEffect } from "react";

type Shortcut = {
  keys: string[];
  callback: (event: KeyboardEvent) => void;
};

const useShortcuts = (shortcuts: Shortcut[]) => {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      const pressedKeys = new Set([e.key.toLowerCase()]);
      if (e.ctrlKey) pressedKeys.add("control");
      if (e.metaKey) pressedKeys.add("meta");
      if (e.shiftKey) pressedKeys.add("shift");
      if (e.altKey) pressedKeys.add("alt");

      for (const { keys, callback } of shortcuts) {
        const isExactMatch =
          keys.length === pressedKeys.size &&
          keys.every((k) => pressedKeys.has(k.toLowerCase()));

        if (isExactMatch) {
          e.preventDefault();
          callback(e);
        }
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [shortcuts]);
};

export default useShortcuts;
