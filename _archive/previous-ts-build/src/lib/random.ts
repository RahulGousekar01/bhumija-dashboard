/** FNV-1a string hash, for seeding. */
export const hashString = (value: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

/** mulberry32: small deterministic PRNG returning [0, 1). */
export const seededRandom = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

export type Random = () => number;

export const pick = <T,>(random: Random, items: readonly T[]): T => items[Math.floor(random() * items.length)]!;

export const between = (random: Random, min: number, max: number): number => min + random() * (max - min);

export const intBetween = (random: Random, min: number, max: number): number =>
  Math.floor(between(random, min, max + 1));

/** Pick by weight: weighted(random, [["a", 3], ["b", 1]]). */
export const weighted = <T,>(random: Random, options: readonly (readonly [T, number])[]): T => {
  const total = options.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [value, weight] of options) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return options[options.length - 1]![0];
};
