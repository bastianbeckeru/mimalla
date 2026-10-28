"use client";

import { type RefObject, useLayoutEffect, useRef } from "react";

const DURATION = 200;
const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";

// Room left around the surface so its rings are not clipped.
const RING_ROOM = 4;

type Point = { x: number; y: number };
type Size = { width: number; height: number };

function prefersReducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getTranslate(element: HTMLElement): Point {
  const { transform } = getComputedStyle(element);
  if (transform === "none") return { x: 0, y: 0 };
  const matrix = new DOMMatrixReadOnly(transform);
  return { x: matrix.e, y: matrix.f };
}

// Glides an element from where it was drawn to where the layout now puts it,
// so grid items slide instead of jumping when their row or column changes.
// `takeOrigin` may hand over a viewport point the element should come from
// instead, such as where a dragged card was released.
export function useLayoutFlip(
  ref: RefObject<HTMLElement | null>,
  takeOrigin: () => Point | null,
) {
  const layout = useRef<Point | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const previous = layout.current;
    const next = { x: element.offsetLeft, y: element.offsetTop };
    layout.current = next;

    const origin = takeOrigin();
    let from: Point | null = null;
    if (origin) {
      const rect = element.getBoundingClientRect();
      const translate = getTranslate(element);
      from = {
        x: origin.x - (rect.left - translate.x),
        y: origin.y - (rect.top - translate.y),
      };
    } else if (previous && (previous.x !== next.x || previous.y !== next.y)) {
      // Start from where the element is drawn right now, mid-glide included.
      const translate = getTranslate(element);
      from = {
        x: previous.x + translate.x - next.x,
        y: previous.y + translate.y - next.y,
      };
    }

    if (!from || (from.x === 0 && from.y === 0)) return;
    for (const animation of element.getAnimations()) animation.cancel();
    if (prefersReducedMotion()) return;
    element.animate(
      [
        { transform: `translate(${from.x}px, ${from.y}px)` },
        { transform: "translate(0, 0)" },
      ],
      { duration: DURATION, easing: EASE_OUT },
    );
  });
}

function getClipPath(box: Size, visible: Size, radius: number) {
  const right = box.width - visible.width - RING_ROOM;
  const bottom = box.height - visible.height - RING_ROOM;
  return `inset(-${RING_ROOM}px ${right}px ${bottom}px -${RING_ROOM}px round ${radius + RING_ROOM}px)`;
}

// Reads how much of the surface a running reveal shows, so a new one picks up
// from there.
function getVisibleSize(surface: HTMLElement): Size | null {
  if (surface.getAnimations().length === 0) return null;
  const [, right, bottom] =
    getComputedStyle(surface)
      .clipPath.match(/-?[\d.]+/g)
      ?.map(Number) ?? [];
  if (right === undefined || bottom === undefined) return null;
  return {
    width: surface.offsetWidth - right - RING_ROOM,
    height: surface.offsetHeight - bottom - RING_ROOM,
  };
}

// Moves a cell's edges to its new size instead of jumping there: the surface
// is clipped from the size it showed to the one the cell now has. When the
// cell shrinks, the surface keeps the larger size until the clip closes in.
export function useSizeReveal(
  cellRef: RefObject<HTMLElement | null>,
  surfaceRef: RefObject<HTMLElement | null>,
) {
  const size = useRef<Size | null>(null);

  useLayoutEffect(() => {
    const cell = cellRef.current;
    const surface = surfaceRef.current;
    if (!cell || !surface) return;
    const previous = size.current;
    const next = { width: cell.offsetWidth, height: cell.offsetHeight };
    size.current = next;
    if (
      !previous ||
      (previous.width === next.width && previous.height === next.height)
    )
      return;

    const from = getVisibleSize(surface) ?? previous;
    for (const animation of surface.getAnimations()) animation.cancel();
    surface.style.width = "";
    surface.style.height = "";
    if (
      prefersReducedMotion() ||
      (from.width === next.width && from.height === next.height)
    )
      return;

    const box = {
      width: Math.max(from.width, next.width),
      height: Math.max(from.height, next.height),
    };
    if (box.width > next.width) surface.style.width = `${box.width}px`;
    if (box.height > next.height) surface.style.height = `${box.height}px`;
    const radius = Number.parseFloat(getComputedStyle(surface).borderRadius);
    const animation = surface.animate(
      [
        { clipPath: getClipPath(box, from, radius) },
        { clipPath: getClipPath(box, next, radius) },
      ],
      { duration: DURATION, easing: EASE_OUT },
    );
    animation.onfinish = () => {
      surface.style.width = "";
      surface.style.height = "";
    };
  });
}
