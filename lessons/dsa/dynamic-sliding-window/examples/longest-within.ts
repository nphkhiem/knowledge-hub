/**
 * The longest stretch whose total stays within a budget, in one pass.
 *
 * Both search functions answer the same question. One tries every start
 * position and extends from it; the other moves two edges that never go
 * backward. Each reports how many values it looked at, because the difference
 * between them is the point.
 *
 * `byWindow` assumes non-negative values. `byExhaustive` assumes nothing and is
 * far too slow to use, which is what makes it a reference: the tests compare
 * against it to show the window is correct on non-negative values and wrong on
 * values that break the assumption.
 */

export interface Search {
  /** The longest width found. */
  readonly width: number;
  /** How many values were examined. */
  readonly reads: number;
}

/** Try each start position and extend from it. Re-reads what it already saw. */
export function byEveryStart(
  values: readonly number[],
  budget: number,
): Search {
  let best = 0;
  let reads = 0;

  for (let start = 0; start < values.length; start += 1) {
    let total = 0;
    for (let end = start; end < values.length; end += 1) {
      total += values[end] ?? 0;
      reads += 1;
      if (total > budget) break;
      best = Math.max(best, end - start + 1);
    }
  }

  return { reads, width: best };
}

/** Move two edges, neither ever backward. One pass over the values. */
export function byWindow(values: readonly number[], budget: number): Search {
  let best = 0;
  let total = 0;
  let start = 0;
  let reads = 0;

  for (let end = 0; end < values.length; end += 1) {
    total += values[end] ?? 0;
    reads += 1;

    // The front edge comes up only while the budget is broken, and stops as
    // soon as it holds. Both halves need the condition to be one-way.
    while (total > budget && start <= end) {
      total -= values[start] ?? 0;
      reads += 1;
      start += 1;
    }

    best = Math.max(best, end - start + 1);
  }

  return { reads, width: best };
}

/**
 * Every stretch, with no early exit. Correct on any values, and far too slow to
 * use. It exists so the tests have something to be right against.
 */
export function byExhaustive(
  values: readonly number[],
  budget: number,
): number {
  let best = 0;

  for (let start = 0; start < values.length; start += 1) {
    let total = 0;
    for (let end = start; end < values.length; end += 1) {
      total += values[end] ?? 0;
      if (total <= budget) best = Math.max(best, end - start + 1);
    }
  }

  return best;
}
