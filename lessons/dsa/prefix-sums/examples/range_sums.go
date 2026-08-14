// Package examples holds runnable lesson implementations.
package examples

// BuildPrefix makes one pass. Entry i holds the total of the first i values,
// so a range needs no special case when it starts at position zero.
func BuildPrefix(values []int) []int {
	prefix := make([]int, 1, len(values)+1)
	for _, value := range values {
		prefix = append(prefix, prefix[len(prefix)-1]+value)
	}
	return prefix
}

// RangeTotalByScan adds the range every time it is asked for.
func RangeTotalByScan(values []int, start, end int) int {
	total := 0
	for index := start; index <= end; index++ {
		total += values[index]
	}
	return total
}

// RangeTotalByPrefix reads two entries and subtracts, whatever the range covers.
func RangeTotalByPrefix(prefix []int, start, end int) int {
	return prefix[end+1] - prefix[start]
}
