"use client";

import { useEffect, useRef, useState } from "react";
import type { SettingsSectionId } from "@/components/dashboard/settings-sections";
import { useSidebar } from "@/components/ui/sidebar";

export type SidebarScreen = "main" | "settings" | SettingsSectionId;

type ScreenEntry = { sidebarScreen: SidebarScreen; sidebarDepth: number };

function readEntry(state: unknown): ScreenEntry | null {
  return typeof state === "object" && state !== null && "sidebarScreen" in state
    ? (state as ScreenEntry)
    : null;
}

export function useSidebarScreen() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar();
  const [screen, setScreen] = useState<SidebarScreen>("main");
  const [wasOpen, setWasOpen] = useState(openMobile);
  const isUnwinding = useRef(false);

  if (openMobile !== wasOpen) {
    setWasOpen(openMobile);
    if (openMobile) {
      setScreen(readEntry(window.history.state)?.sidebarScreen ?? "main");
    }
  }

  useEffect(() => {
    function handlePopState(event: PopStateEvent) {
      isUnwinding.current = false;
      const entry = readEntry(event.state);
      if (entry) setScreen(entry.sidebarScreen);
      setOpenMobile(entry !== null);
    }
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setOpenMobile]);

  useEffect(() => {
    if (!isMobile && openMobile) setOpenMobile(false);
  }, [isMobile, openMobile, setOpenMobile]);

  useEffect(() => {
    const entry = readEntry(window.history.state);
    if (openMobile && !entry) {
      window.history.pushState(
        { sidebarScreen: "main", sidebarDepth: 1 } satisfies ScreenEntry,
        "",
      );
    }
    if (!openMobile && entry && !isUnwinding.current) {
      isUnwinding.current = true;
      window.history.go(-entry.sidebarDepth);
    }
  }, [openMobile]);

  useEffect(
    () => () => {
      const entry = readEntry(window.history.state);
      if (entry) window.history.go(-entry.sidebarDepth);
    },
    [],
  );

  function openScreen(next: SidebarScreen) {
    const depth = readEntry(window.history.state)?.sidebarDepth ?? 0;
    window.history.pushState(
      { sidebarScreen: next, sidebarDepth: depth + 1 } satisfies ScreenEntry,
      "",
    );
    setScreen(next);
  }

  return { screen, openScreen, goBack: () => window.history.back() };
}
