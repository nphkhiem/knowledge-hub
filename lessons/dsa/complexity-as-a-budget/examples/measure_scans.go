// Package examples holds runnable lesson implementations.
package examples

// StepsForPairwiseScan compares every item with every later item and returns
// the number of comparisons performed. The cost grows with the square of the
// input, which is the point the lesson makes.
func StepsForPairwiseScan(values []int) int {
	steps := 0
	for left := 0; left < len(values); left++ {
		for right := left + 1; right < len(values); right++ {
			steps++
			if values[left] == values[right] {
				return steps
			}
		}
	}
	return steps
}

// StepsForSingleScan reads each item once against a set of what was already
// seen, so the cost tracks the input rather than its square.
func StepsForSingleScan(values []int) int {
	steps := 0
	seen := make(map[int]struct{}, len(values))
	for _, value := range values {
		steps++
		if _, found := seen[value]; found {
			return steps
		}
		seen[value] = struct{}{}
	}
	return steps
}
