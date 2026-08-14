/**
 * Count the slots two membership checks examine on the same keys.
 *
 * The lesson's claim is that hashing removes a scan. Both functions return how
 * many stored keys they had to look at, so the difference is observable.
 */

/** A deliberately simple hash, so the slot for a key is easy to follow. */
export function hashSlot(key: string, slots: number): number {
  let total = 0;
  for (const character of key) {
    total = (total * 31 + character.charCodeAt(0)) % slots;
  }
  return total;
}

/** Compare against each key in turn. Cost grows with the collection. */
export function keysExaminedByScan(
  keys: readonly string[],
  wanted: string,
): number {
  let examined = 0;
  for (const key of keys) {
    examined += 1;
    if (key === wanted) return examined;
  }
  return examined;
}

/** Read only the keys that share the wanted key's slot. */
export function keysExaminedByHash(
  keys: readonly string[],
  wanted: string,
  slots: number,
): number {
  const table = new Map<number, string[]>();
  for (const key of keys) {
    const slot = hashSlot(key, slots);
    table.set(slot, [...(table.get(slot) ?? []), key]);
  }

  let examined = 0;
  for (const key of table.get(hashSlot(wanted, slots)) ?? []) {
    examined += 1;
    if (key === wanted) return examined;
  }
  return examined;
}
