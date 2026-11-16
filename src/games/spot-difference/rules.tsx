import { DIFFERENCE_COUNT } from "./difficulty";
import { MAX_LIVES } from "./game";

export const SPOT_DIFFERENCE_RULE_STEPS = [
  `The two pictures look the same, but ${DIFFERENCE_COUNT} things are different. Tap a difference in either picture to circle it.`,
  `You have ${MAX_LIVES} lives. Tapping a spot with no difference costs one.`,
  "A difference can be something missing, moved, bigger or smaller, a different colour or a slightly different shape.",
  "The fewer mistakes you make, the more points you earn.",
  "On a small screen, use Zoom in to enlarge both pictures; they scroll together.",
  "With a keyboard, press Tab to focus a picture, move the crosshair with the arrow keys (hold Shift for small steps) and press Enter or Space to mark a difference.",
];
