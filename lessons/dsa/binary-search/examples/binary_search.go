// Package examples holds runnable lesson implementations.
package examples

// Search reports where a value was found and how many values were examined to
// decide. Found is false when the value is absent.
type Search struct {
	Index  int
	Found  bool
	Probes int
}

// ByScan walks from one end, ignoring the order the values are already in.
func ByScan(values []int, target int) Search {
	for index, value := range values {
		if value == target {
			return Search{Index: index, Found: true, Probes: index + 1}
		}
	}
	return Search{Probes: len(values)}
}

// ByHalving keeps the range that could still hold the target, and halves it.
func ByHalving(values []int, target int) Search {
	low, high := 0, len(values)-1
	probes := 0

	for low <= high {
		// low + (high - low) / 2, not (low + high) / 2. The sum overflows a
		// fixed-width int once the indices are large enough; the offset cannot.
		middle := low + (high-low)/2
		probes++

		switch {
		case values[middle] == target:
			return Search{Index: middle, Found: true, Probes: probes}
		case values[middle] < target:
			low = middle + 1
		default:
			high = middle - 1
		}
	}

	return Search{Probes: probes}
}
