import type { Course, Curriculum } from "@/builder/draft";
import {
  DEFAULT_COURSE_COLOR,
  getLuminance,
  hexToHSL,
  hslToHex,
} from "@/utils/colors";

export const BASE_COLORS = [
  "#4f46e5",
  "#2563eb",
  "#0d9488",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#9333ea",
] as const;

export const DEFAULT_BASE_COLOR: string = BASE_COLORS[0];

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export function isHexColor(color: string) {
  return HEX_COLOR_PATTERN.test(color);
}

const SHADE_LIGHTNESSES = [30, 70, 45, 85, 22, 58];

export function getAreaShades(baseColor: string) {
  const { h, s } = hexToHSL(baseColor as `#${string}`);
  return SHADE_LIGHTNESSES.map((lightness) => hslToHex(h, s, lightness));
}

export function getCourseColor(curriculum: Curriculum, course: Course) {
  const area = curriculum.areas.find(({ id }) => id === course.areaId);
  return area?.color ?? DEFAULT_COURSE_COLOR;
}

const DARK_TEXT_COLOR = "#0a0a0a";
const LIGHT_TEXT_COLOR = "#fafafa";

function getContrastRatio(a: string, b: string) {
  const [lighter, darker] = [
    getLuminance(a as `#${string}`),
    getLuminance(b as `#${string}`),
  ].toSorted((x, y) => y - x) as [number, number];
  return (lighter + 0.05) / (darker + 0.05);
}

export function getTextColor(background: string) {
  return getContrastRatio(background, DARK_TEXT_COLOR) >=
    getContrastRatio(background, LIGHT_TEXT_COLOR)
    ? DARK_TEXT_COLOR
    : LIGHT_TEXT_COLOR;
}
