/**
 * Combining overlapping spans, and what happens without the sort.
 *
 * `mergeSorted` is the real implementation: sort by start, sweep once.
 * `sweepOnly` is the same sweep with the sort removed, which is not a warning in
 * prose but a function whose wrong answers the tests check.
 *
 * Spans that merely touch are merged here. That is a decision rather than a
 * fact, so the comparison is named once and used everywhere.
 */

export type Span = readonly [number, number];

/**
 * Whether `span` can join `group`, given both start no earlier than it.
 *
 * Change this one comparison to `<` and touching spans stay separate, which is
 * right for ranges of distinct identifiers and wrong for calendar bookings.
 */
export function touchesOrOverlaps(group: Span, span: Span): boolean {
  return span[0] <= group[1];
}

/** Sweep without sorting. Correct only if the caller already sorted. */
export function sweepOnly(spans: readonly Span[]): Span[] {
  const first = spans[0];
  if (first === undefined) return [];

  const merged: Span[] = [first];
  for (const span of spans.slice(1)) {
    const group = merged[merged.length - 1] ?? first;
    if (touchesOrOverlaps(group, span)) {
      // Only the end moves, and it takes the larger of the two. Taking
      // `span[1]` instead shrinks the group whenever one span nests inside
      // another, which is the classic defect.
      merged[merged.length - 1] = [group[0], Math.max(group[1], span[1])];
    } else {
      merged.push(span);
    }
  }

  return merged;
}

/** Sort by where each span begins, then sweep once. */
export function mergeSorted(spans: readonly Span[]): Span[] {
  return sweepOnly([...spans].sort((left, right) => left[0] - right[0]));
}

/** Total length covered, counted from the merged spans. */
export function coveredUnits(spans: readonly Span[]): number {
  return mergeSorted(spans).reduce(
    (total, [start, end]) => total + end - start,
    0,
  );
}

/** The free spaces between merged spans, from the same pass. */
export function gapsBetween(spans: readonly Span[]): Span[] {
  const merged = mergeSorted(spans);
  const gaps: Span[] = [];

  for (let at = 0; at + 1 < merged.length; at += 1) {
    const before = merged[at];
    const after = merged[at + 1];
    if (before !== undefined && after !== undefined && after[0] > before[1]) {
      gaps.push([before[1], after[0]]);
    }
  }

  return gaps;
}

/** Every unit, checked against every span. Far too slow, and a reference. */
export function coveredByBruteForce(
  spans: readonly Span[],
  spanLimit: number,
): number {
  let total = 0;
  for (let unit = 0; unit < spanLimit; unit += 1) {
    if (spans.some(([start, end]) => start <= unit && unit < end)) total += 1;
  }
  return total;
}
