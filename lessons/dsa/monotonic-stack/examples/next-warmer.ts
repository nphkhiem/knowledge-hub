/**
 * How many days until a warmer one, by ordered pile and by comparing pairs.
 *
 * Both answer the same question. The pile reads the days once; the pairwise
 * version compares every day with every later day, which is what the ordering
 * removes. Each reports how many comparisons it made.
 *
 * A day with no warmer day after it has no answer, which is a result rather
 * than an error, so both return undefined for it rather than a sentinel.
 */

export interface Report {
  /** Days until warmer for each day, or undefined when none follows. */
  readonly waits: (number | undefined)[];
  /** How many comparisons it took. */
  readonly comparisons: number;
}

/** Look ahead from every day. Correct, and grows with the square. */
export function byComparingPairs(highs: readonly number[]): Report {
  const waits: (number | undefined)[] = [];
  let comparisons = 0;

  for (let day = 0; day < highs.length; day += 1) {
    let found: number | undefined;
    for (let later = day + 1; later < highs.length; later += 1) {
      comparisons += 1;
      if ((highs[later] ?? 0) > (highs[day] ?? 0)) {
        found = later - day;
        break;
      }
    }
    waits.push(found);
  }

  return { comparisons, waits };
}

/**
 * Keep unanswered days on a pile in decreasing order. One pass.
 *
 * The pile holds positions rather than temperatures, because the answer is a
 * distance and a position can produce both. See the deep dive.
 */
export function byOrderedPile(highs: readonly number[]): Report {
  const waits: (number | undefined)[] = Array.from(
    { length: highs.length },
    () => undefined,
  );
  const waiting: number[] = [];
  let comparisons = 0;

  for (let day = 0; day < highs.length; day += 1) {
    // Everything this day answers is on top, because the pile is ordered.
    while (waiting.length > 0) {
      comparisons += 1;
      const top = waiting[waiting.length - 1] ?? 0;
      if ((highs[top] ?? 0) >= (highs[day] ?? 0)) break;
      waiting.pop();
      waits[top] = day - top;
    }
    waiting.push(day);
  }

  // Whatever is still waiting never found a warmer day. That is the answer.
  return { comparisons, waits };
}
