// Package examples holds runnable lesson implementations.
package examples

// Search reports the longest width found and how many values were examined.
type Search struct {
	Width int
	Reads int
}

// ByEveryStart tries each start position and extends from it, re-reading what
// it already saw.
func ByEveryStart(values []int, budget int) Search {
	best, reads := 0, 0

	for start := range values {
		total := 0
		for end := start; end < len(values); end++ {
			total += values[end]
			reads++
			if total > budget {
				break
			}
			if width := end - start + 1; width > best {
				best = width
			}
		}
	}

	return Search{Width: best, Reads: reads}
}

// ByWindow moves two edges, neither ever backward, in one pass over the values.
// It is correct only while the values are non-negative.
func ByWindow(values []int, budget int) Search {
	best, total, start, reads := 0, 0, 0, 0

	for end := range values {
		total += values[end]
		reads++

		// The front edge comes up only while the budget is broken, and stops as
		// soon as it holds. Both halves need the condition to be one-way.
		for total > budget && start <= end {
			total -= values[start]
			reads++
			start++
		}

		if width := end - start + 1; width > best {
			best = width
		}
	}

	return Search{Width: best, Reads: reads}
}

// ByExhaustive checks every stretch with no early exit. It is correct on any
// values and far too slow to use, which is what makes it a reference.
func ByExhaustive(values []int, budget int) int {
	best := 0

	for start := range values {
		total := 0
		for end := start; end < len(values); end++ {
			total += values[end]
			if total <= budget {
				if width := end - start + 1; width > best {
					best = width
				}
			}
		}
	}

	return best
}
