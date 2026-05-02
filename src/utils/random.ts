export function nextSeed(seed: number): number {
  return (seed + 0x6d2b79f5) >>> 0;
}

export function randomFromSeed(seed: number): { value: number; nextSeed: number } {
  const next = nextSeed(seed);
  let t = next;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  const value = ((t ^ (t >>> 14)) >>> 0) / 4294967296;

  return {
    value,
    nextSeed: next,
  };
}

export function chooseBySeed<T>(
  items: readonly T[],
  seed: number,
): { action: T; rngState: number } {
  if (items.length === 0) {
    throw new Error("Cannot choose from an empty array.");
  }

  const { value, nextSeed } = randomFromSeed(seed);
  const index = Math.min(items.length - 1, Math.floor(value * items.length));

  return {
    action: items[index],
    rngState: nextSeed,
  };
}
