/**
 * Searching a sorted sequence by halving, and by scanning it.
 *
 * Both functions answer the same question. They differ in how many values they
 * look at to answer it, which is the point of the lesson, so each reports the
 * number of values it examined.
 */

export interface Search {
  /** Where the value was found, or undefined when it is absent. */
  readonly index: number | undefined;
  /** How many values were examined to decide. */
  readonly probes: number;
}

/** Walk from one end, ignoring the order the values are already in. */
export function byScan(values: readonly number[], target: number): Search {
  for (let index = 0; index < values.length; index += 1) {
    if (values[index] === target) return { index, probes: index + 1 };
  }
  return { index: undefined, probes: values.length };
}

/** Keep the range that could still hold the target, and halve it. */
export function byHalving(values: readonly number[], target: number): Search {
  let low = 0;
  let high = values.length - 1;
  let probes = 0;

  while (low <= high) {
    // low + (high - low) / 2, not (low + high) / 2. The sum can overflow a
    // fixed-width integer; the offset cannot. See the deep dive.
    const middle = low + Math.floor((high - low) / 2);
    const value = values[middle];
    probes += 1;

    if (value === target) return { index: middle, probes };
    if (value !== undefined && value < target) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return { index: undefined, probes };
}
