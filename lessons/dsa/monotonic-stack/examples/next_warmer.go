// Package examples holds runnable lesson implementations.
package examples

// Wait is how many days until a warmer one. Found is false when no warmer day
// follows, which is a result rather than an error.
type Wait struct {
	Days  int
	Found bool
}

// Report carries a wait per day and the comparisons it took to produce them.
type Report struct {
	Waits       []Wait
	Comparisons int
}

// ByComparingPairs looks ahead from every day. Correct, and grows with the
// square of the history.
func ByComparingPairs(highs []int) Report {
	report := Report{Waits: make([]Wait, 0, len(highs))}

	for day, high := range highs {
		found := Wait{}
		for later := day + 1; later < len(highs); later++ {
			report.Comparisons++
			if highs[later] > high {
				found = Wait{Days: later - day, Found: true}
				break
			}
		}
		report.Waits = append(report.Waits, found)
	}

	return report
}

// ByOrderedPile keeps unanswered days on a pile in decreasing order, in one
// pass.
//
// The pile holds positions rather than temperatures, because the answer is a
// distance and a position can produce both. See the deep dive.
func ByOrderedPile(highs []int) Report {
	report := Report{Waits: make([]Wait, len(highs))}
	waiting := []int{}

	for day, high := range highs {
		// Everything this day answers is on top, because the pile is ordered.
		for len(waiting) > 0 {
			report.Comparisons++
			top := waiting[len(waiting)-1]
			if highs[top] >= high {
				break
			}
			waiting = waiting[:len(waiting)-1]
			report.Waits[top] = Wait{Days: day - top, Found: true}
		}
		waiting = append(waiting, day)
	}

	// Whatever is still waiting never found a warmer day. That is the answer.
	return report
}
