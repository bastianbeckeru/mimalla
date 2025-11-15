/** BUSCAR react-use-hotkeys
 *  https://github.com/reecelucas/react-use-hotkeys/blob/master/src/index.ts
 */

import { useEffect } from "react";
//import { useIsMac } from "./use-mac";

type Shortcut = {
  //keys: string | string[];
  keys: string[];
  callback: (event: KeyboardEvent) => void;
};

const useShortcuts = (shortcuts: Shortcut[]) => {
  //const isMac = useIsMac();

  useEffect(() => {
    const pressedKeys = new Set<string>();

    const handleKeydown = (e: KeyboardEvent) => {
      pressedKeys.add(e.key.toLowerCase());

      shortcuts.forEach(({ keys, callback }) => {
        const normalizedKeys = keys.map((k) => k.toLowerCase());

        const allKeysPressed = normalizedKeys.every((k) => {
          if (k === "control") return e.ctrlKey || pressedKeys.has("control");
          if (k === "meta") return e.metaKey || pressedKeys.has("meta");
          if (k === "shift") return e.shiftKey || pressedKeys.has("shift");
          if (k === "alt") return e.altKey || pressedKeys.has("alt");

          return pressedKeys.has(k);
        });

        if (allKeysPressed) {
          e.preventDefault();
          callback(e);
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
