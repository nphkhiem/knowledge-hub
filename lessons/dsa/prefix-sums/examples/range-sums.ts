/**
 * Range totals, computed directly and through prefix sums.
 *
 * The prefix array carries a leading zero, so `prefix[i]` is the total of the
 * first i values and a range needs no special case when it starts at 0.
 */

/** One pass. Entry i holds the total of the first i values. */
export function buildPrefix(values: readonly number[]): number[] {
  const prefix = [0];
  for (const value of values) {
    prefix.push((prefix.at(-1) ?? 0) + value);
  }
  return prefix;
}

/** Add the range every time it is asked for. */
export function rangeTotalByScan(
  values: readonly number[],
  start: number,
  end: number,
): number {
  let total = 0;
  for (let index = start; index <= end; index += 1) {
    total += values[index] ?? 0;
  }
  return total;
}

/** Two reads and a subtraction, whatever the range covers. */
export function rangeTotalByPrefix(
  prefix: readonly number[],
  start: number,
  end: number,
): number {
  return (prefix[end + 1] ?? 0) - (prefix[start] ?? 0);
}
