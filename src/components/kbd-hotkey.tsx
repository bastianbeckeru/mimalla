"use client";

import {
  detectPlatform,
  formatForDisplay,
  type RegisterableHotkey,
} from "@tanstack/react-hotkeys";
import { useSyncExternalStore } from "react";
import { Kbd } from "@/components/ui/kbd";

const subscribeToPlatform = () => () => {};

export default function KbdHotkey({ hotkey }: { hotkey: RegisterableHotkey }) {
  const platform = useSyncExternalStore(
    subscribeToPlatform,
    detectPlatform,
    () => "linux" as const,
  );

  return <Kbd>{formatForDisplay(hotkey, { platform })}</Kbd>;
}
