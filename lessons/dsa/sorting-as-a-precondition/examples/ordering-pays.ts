/**
 * What ordering buys a later search, and what it costs to get it.
 *
 * The sort itself is the language's own, because the lesson is about treating
 * order as a precondition rather than about how to establish it. What is
 * measured here is the work of the questions that follow.
 */

export interface Probe {
  /** Where the value was found, or undefined when it is absent. */
  readonly index: number | undefined;
  /** How many values were examined to decide. */
  readonly comparisons: number;
}

export interface Placed {
  readonly value: number;
  /** The position this value occupied before anything was ordered. */
  readonly origin: number;
}

/** Examine values in the order given. Nothing rules anything out. */
export function byScan(values: readonly number[], target: number): Probe {
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === target) return { comparisons: index + 1, index };
  }
  return { comparisons: values.length, index: undefined };
}

/** Halve the range each time. Correct only if `values` is ordered. */
export function byHalving(values: readonly number[], target: number): Probe {
  let low = 0;
  let high = values.length - 1;
  let comparisons = 0;

  while (low <= high) {
    const middle = low + Math.floor((high - low) / 2);
    const value = values[middle];
    comparisons += 1;

    if (value === target) return { comparisons, index: middle };
    if (value !== undefined && value < target) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return { comparisons, index: undefined };
}

/**
 * Order the values while carrying where each one started.
 *
 * Sorting values alone destroys the arrival order. Carrying the position is the
 * only way back, and it has to be done before the sort, not after. Array sort
 * is stable, so equal values keep their original relative order.
 */
export function sortedWithOrigin(values: readonly number[]): Placed[] {
  return values
    .map((value, origin) => ({ origin, value }))
    .sort((left, right) => left.value - right.value);
}
