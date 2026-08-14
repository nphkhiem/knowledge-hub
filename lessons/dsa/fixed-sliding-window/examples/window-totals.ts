/**
 * Totals of every fixed-width window, rebuilt and repaired.
 *
 * Both functions answer the same question and return the same totals. They
 * differ only in how much arithmetic they do to get there, which is the point
 * of the lesson, so each also reports the additions and subtractions it
 * performed.
 */

export interface WindowScan {
  /** The total of each window, in order. */
  readonly totals: number[];
  /** The additions and subtractions it cost to produce them. */
  readonly operations: number;
}

/**
 * Windows of `width` that fit in `length` values, never fewer than zero.
 *
 * A width larger than the sequence yields no windows at all rather than one
 * short window, because a partial window answers a different question.
 */
export function windowCount(length: number, width: number): number {
  if (width <= 0) return 0;
  return Math.max(0, length - width + 1);
}

/** Add every window from scratch. Costs `width` additions per window. */
export function byRescan(values: readonly number[], width: number): WindowScan {
  const totals: number[] = [];
  let operations = 0;

  for (let start = 0; start < windowCount(values.length, width); start += 1) {
    let total = 0;
    for (let index = start; index < start + width; index += 1) {
      total += values[index] ?? 0;
      operations += 1;
    }
    totals.push(total);
  }

  return { totals, operations };
}

/** Build the first window, then repair it. Each move costs exactly two. */
export function bySliding(
  values: readonly number[],
  width: number,
): WindowScan {
  const count = windowCount(values.length, width);
  if (count === 0) return { totals: [], operations: 0 };

  let total = 0;
  let operations = 0;
  for (let index = 0; index < width; index += 1) {
    total += values[index] ?? 0;
    operations += 1;
  }

  const totals = [total];
  for (let start = 1; start < count; start += 1) {
    total -= values[start - 1] ?? 0;
    total += values[start + width - 1] ?? 0;
    operations += 2;
    totals.push(total);
  }

  return { totals, operations };
}

/** The largest window total, or undefined when no window fits. */
export function bestWindowTotal(
  values: readonly number[],
  width: number,
): number | undefined {
  const { totals } = bySliding(values, width);
  return totals.length === 0 ? undefined : Math.max(...totals);
}
