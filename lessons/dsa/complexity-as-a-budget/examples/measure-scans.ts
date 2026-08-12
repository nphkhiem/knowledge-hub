/**
 * Count the steps two duplicate checks spend on the same input.
 *
 * The point of the lesson is that the step count, not the wall clock, is what
 * grows with the input, so both functions return the comparisons they made.
 */

/** Compare every item with every later item. Cost grows with n squared. */
export function stepsForPairwiseScan(values: readonly number[]): number {
  let steps = 0;
  for (let left = 0; left < values.length; left += 1) {
    for (let right = left + 1; right < values.length; right += 1) {
      steps += 1;
      if (values[left] === values[right]) return steps;
    }
  }
  return steps;
}

/** Read each item once against a set of what was already seen. */
export function stepsForSingleScan(values: readonly number[]): number {
  let steps = 0;
  const seen = new Set<number>();
  for (const value of values) {
    steps += 1;
    if (seen.has(value)) return steps;
    seen.add(value);
  }
  return steps;
}
