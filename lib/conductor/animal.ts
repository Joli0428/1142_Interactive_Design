import type { AnimalId } from "./types";

/** X ratio → animal; mirrors stage layout: left=frog, center=otter, right=bird */
export function ratioXToAnimal(ratioX: number): AnimalId {
  if (ratioX > 0.66) return "frog";
  if (ratioX > 0.33) return "otter";
  return "bird";
}
