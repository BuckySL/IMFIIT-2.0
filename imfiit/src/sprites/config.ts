import type { BodyType } from "../App";

export type FighterAction =
  | "idle"
  | "walk"
  | "punch"
  | "block"
  | "hit"
  | "victory"
  | "defeat";

export interface SpriteConfig {
  url: string;
  cols: number; // grid columns in the sheet
  rows: number; // grid rows in the sheet
  // map actions -> frame indexes (left-to-right, top-to-bottom, starting at 0)
  actions: Record<FighterAction, number[]>;
}

// Helper to make a 4x2 sheet map with the same layout
const make4x2 = (url: string): SpriteConfig => ({
  url,
  cols: 4,
  rows: 2,
  // 👇 default guesses based on your images (adjust if a body type differs)
  // index map:
  //  0 1 2 3
  //  4 5 6 7
  actions: {
    idle:    [0],
    walk:    [1, 4],      // small 2-frame cycle
    punch:   [2],         // 1-frame punch (quick burst)
    block:   [3],
    hit:     [5],
    victory: [6],
    defeat:  [7],
  },
});

export const SPRITES: Record<BodyType, SpriteConfig> = {
  "fit-male": make4x2("/sprites/fit-male.png"),
  "fit-female": make4x2("/sprites/fit-female.png"),
  "skinny-male": make4x2("/sprites/skinny-male.png"),
  "skinny-female": make4x2("/sprites/skinny-female.png"),
  "overweight-male": make4x2("/sprites/overweight-male.png"),
  "overweight-female": make4x2("/sprites/overweight-female.png"),
  "obese-male": make4x2("/sprites/obese-male.png"),
  "obese-female": make4x2("/sprites/obese-female.png"),
};
