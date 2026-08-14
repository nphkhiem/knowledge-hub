// Package examples holds runnable lesson implementations.
package examples

// WindowScan carries the total of each window and the arithmetic it cost to
// produce them. Both strategies below return the same totals and differ only in
// the operation count, which is the point of the lesson.
type WindowScan struct {
	Totals     []int
	Operations int
}

// WindowCount reports how many windows of width fit in length values, never
// fewer than zero.
//
// A width larger than the sequence yields no windows at all rather than one
// short window, because a partial window answers a different question.
func WindowCount(length, width int) int {
	if width <= 0 || length-width+1 < 0 {
		return 0
	}
	return length - width + 1
}

// ByRescan adds every window from scratch, costing one addition per value per
// window.
func ByRescan(values []int, width int) WindowScan {
	scan := WindowScan{Totals: []int{}}

	for start := 0; start < WindowCount(len(values), width); start++ {
		total := 0
		for index := start; index < start+width; index++ {
			total += values[index]
			scan.Operations++
		}
		scan.Totals = append(scan.Totals, total)
	}

	return scan
}

// BySliding builds the first window and then repairs it, so each move costs
// exactly one subtraction and one addition however wide the window is.
func BySliding(values []int, width int) WindowScan {
	count := WindowCount(len(values), width)
	if count == 0 {
		return WindowScan{Totals: []int{}}
	}

	total := 0
	operations := 0
	for index := 0; index < width; index++ {
		total += values[index]
		operations++
	}

	totals := []int{total}
	for start := 1; start < count; start++ {
		total -= values[start-1]
		total += values[start+width-1]
		operations += 2
		totals = append(totals, total)
	}

	return WindowScan{Totals: totals, Operations: operations}
}

// BestWindowTotal reports the largest window total. The second result is false
// when no window fits.
func BestWindowTotal(values []int, width int) (int, bool) {
	totals := BySliding(values, width).Totals
	if len(totals) == 0 {
		return 0, false
	}

	best := totals[0]
	for _, total := range totals[1:] {
		if total > best {
			best = total
		}
	}
	return best, true
}
