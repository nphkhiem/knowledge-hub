/**
 * Finds the indices of the two values in an ascending-sorted array that add to
 * the target, moving one pointer inward at a time.
 *
 * Returns the pair of indices, or undefined when no pair sums to the target.
 * Runs in O(n) time and O(1) additional space.
 */
export function findPairWithSum(
  values: readonly number[],
  target: number,
): readonly [number, number] | undefined {
  let left = 0;
  let right = values.length - 1;

  while (left < right) {
    const leftValue = values[left];
    const rightValue = values[right];
    if (leftValue === undefined || rightValue === undefined) return undefined;

    const sum = leftValue + rightValue;
    if (sum === target) return [left, right];

    // The larger value cannot pair with anything still in range, so discard it.
    if (sum > target) right -= 1;
    else left += 1;
  }

  return undefined;
}
