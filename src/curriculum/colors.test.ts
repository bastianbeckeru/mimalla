import { describe, expect, test } from "bun:test";
import { getCardEdge, getTextColor } from "@/curriculum/colors";
import type { HexColor } from "@/types/colors";
import { DEFAULT_COURSE_COLOR, getLuminance } from "@/utils/colors";

function contrast(a: HexColor, b: HexColor) {
  const [lighter, darker] = [getLuminance(a), getLuminance(b)].toSorted(
    (x, y) => y - x,
  ) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

function toHex(channel: number) {
  return channel.toString(16).padStart(2, "0");
}

describe("getTextColor", () => {
  test("reaches 4.5:1 on every gray", () => {
    for (let value = 0; value < 256; value++) {
      const gray: HexColor = `#${toHex(value).repeat(3)}`;
      expect(contrast(gray, getTextColor(gray))).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("reaches 4.5:1 on mid-tone area colors", () => {
    for (const color of ["#db2777", "#12873d", "#3b73ed"] as HexColor[])
      expect(contrast(color, getTextColor(color))).toBeGreaterThanOrEqual(4.5);
  });

  test("keeps the theme's text colors when they are legible", () => {
    expect(getTextColor("#fdf5b5")).toBe("#0a0a0a");
    expect(getTextColor("#130e62")).toBe("#fafafa");
  });
});

describe("getCardEdge", () => {
  test("outlines a card that blends with the light background", () => {
    expect(getCardEdge(DEFAULT_COURSE_COLOR, false)).toEqual({
      onLight: true,
      onDark: false,
    });
    expect(getCardEdge("#fdf5b5", false).onLight).toBe(true);
  });

  test("outlines a card that blends with the dark background", () => {
    expect(getCardEdge("#130e62", false)).toEqual({
      onLight: false,
      onDark: true,
    });
  });

  test("leaves a card that stands out on both backgrounds", () => {
    expect(getCardEdge("#d97706", false)).toEqual({
      onLight: false,
      onDark: false,
    });
  });

  test("outlines a muted card, which fades toward the background", () => {
    expect(getCardEdge("#d97706", true)).toEqual({
      onLight: true,
      onDark: true,
    });
  });
});
