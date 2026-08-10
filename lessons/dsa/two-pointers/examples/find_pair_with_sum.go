// Package examples holds runnable lesson implementations.
package examples

// FindPairWithSum moves two pointers inward across an ascending-sorted
// slice and returns the indices of the two values that add to target.
//
// values must be sorted in ascending order. Returns (0, 0, false) when no
// pair sums to the target. Runs in O(n) time and O(1) additional space.
func FindPairWithSum(values []int, target int) (int, int, bool) {
	left, right := 0, len(values)-1

	for left < right {
		total := values[left] + values[right]
		if total == target {
			return left, right, true
		}

		// The larger value cannot pair with anything still in range, so drop it.
		if total > target {
			right--
		} else {
			left++
		}
	}

	return 0, 0, false
}
