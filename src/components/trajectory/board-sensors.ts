import {
  KeyboardSensor,
  PointerActivationConstraints,
  PointerSensor,
} from "@dnd-kit/dom";
import {
  GRID_CELL_HEIGHT,
  GRID_CELL_WIDTH,
  GRID_GAP,
} from "@/curriculum/grid-cells";

const DRAG_ACTIVATION_DISTANCE = 5;
const TOUCH_HOLD_MS = 300;
const TOUCH_HOLD_TOLERANCE = 8;
const ROOT_FONT_SIZE = 16;

export const sensors = [
  PointerSensor.configure({
    activationConstraints: (event) =>
      event.pointerType === "touch"
        ? [
            new PointerActivationConstraints.Delay({
              value: TOUCH_HOLD_MS,
              tolerance: TOUCH_HOLD_TOLERANCE,
            }),
          ]
        : [
            new PointerActivationConstraints.Distance({
              value: DRAG_ACTIVATION_DISTANCE,
            }),
          ],
  }),
  KeyboardSensor.configure({
    offset: {
      x: (GRID_CELL_WIDTH + GRID_GAP) * ROOT_FONT_SIZE,
      y: (GRID_CELL_HEIGHT + GRID_GAP) * ROOT_FONT_SIZE,
    },
    keyboardCodes: {
      start: ["Space"],
      cancel: ["Escape", "Tab"],
      end: ["Space"],
      up: ["ArrowUp"],
      down: ["ArrowDown"],
      left: ["ArrowLeft"],
      right: ["ArrowRight"],
    },
  }),
];
