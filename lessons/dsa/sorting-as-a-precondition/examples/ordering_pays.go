// Package examples holds runnable lesson implementations.
package examples

import "slices"

// Probe reports where a value was found and how many values were examined.
// Found is false when the value is absent.
type Probe struct {
	Index       int
	Found       bool
	Comparisons int
}

// Placed carries a value and the position it occupied before anything was
// ordered.
type Placed struct {
	Value  int
	Origin int
}

// ByScan examines values in the order given. Nothing rules anything out.
func ByScan(values []int, target int) Probe {
	for index, value := range values {
		if value == target {
			return Probe{Index: index, Found: true, Comparisons: index + 1}
		}
	}
	return Probe{Comparisons: len(values)}
}

// ByHalving halves the range each time. It is correct only if values is
// ordered, and returns a confident wrong answer otherwise.
func ByHalving(values []int, target int) Probe {
	low, high := 0, len(values)-1
	comparisons := 0

	for low <= high {
		middle := low + (high-low)/2
		comparisons++

		switch {
		case values[middle] == target:
			return Probe{Index: middle, Found: true, Comparisons: comparisons}
		case values[middle] < target:
			low = middle + 1
		default:
			high = middle - 1
		}
	}

	return Probe{Comparisons: comparisons}
}

// SortedWithOrigin orders the values while carrying where each one started.
//
// Sorting values alone destroys the arrival order. Carrying the position is the
// only way back, and it has to be done before the sort, not after. The stable
// sort is deliberate, so equal values keep their original relative order.
func SortedWithOrigin(values []int) []Placed {
	placed := make([]Placed, 0, len(values))
	for origin, value := range values {
		placed = append(placed, Placed{Value: value, Origin: origin})
	}

	slices.SortStableFunc(placed, func(left, right Placed) int {
		return left.Value - right.Value
	})
	return placed
}
