import { describe, expect, test } from "bun:test";
import {
  DEFAULT_SIDEBAR_WIDTH,
  getDraggedSidebarWidth,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
  parseSidebarWidth,
} from "@/utils/sidebar-width";

describe("getDraggedSidebarWidth", () => {
  test("follows the pointer between the limits", () => {
    expect(getDraggedSidebarWidth(300.4)).toEqual({
      width: 300,
      isClosing: false,
    });
  });

  test("stops at the maximum", () => {
    expect(getDraggedSidebarWidth(900).width).toBe(MAX_SIDEBAR_WIDTH);
  });

  test("holds the minimum just past it without closing", () => {
    expect(getDraggedSidebarWidth(MIN_SIDEBAR_WIDTH - 40)).toEqual({
      width: MIN_SIDEBAR_WIDTH,
      isClosing: false,
    });
  });

  test("closes when dragged well past the minimum", () => {
    expect(getDraggedSidebarWidth(MIN_SIDEBAR_WIDTH - 41)).toEqual({
      width: MIN_SIDEBAR_WIDTH,
      isClosing: true,
    });
  });
});

describe("parseSidebarWidth", () => {
  test("uses the default when nothing valid is stored", () => {
    expect(parseSidebarWidth(null)).toBe(DEFAULT_SIDEBAR_WIDTH);
    expect(parseSidebarWidth("wide")).toBe(DEFAULT_SIDEBAR_WIDTH);
  });

  test("keeps a stored width inside the limits", () => {
    expect(parseSidebarWidth("300")).toBe(300);
    expect(parseSidebarWidth("9000")).toBe(MAX_SIDEBAR_WIDTH);
    expect(parseSidebarWidth("10")).toBe(MIN_SIDEBAR_WIDTH);
  });
});
