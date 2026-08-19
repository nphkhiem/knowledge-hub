// Package examples holds runnable lesson implementations.
package examples

import (
	"math/rand"
	"slices"
)

// Span has an inclusive start and an exclusive end.
type Span struct {
	Start int
	End   int
}

// TouchesOrOverlaps reports whether span can join group, given both start no
// earlier than it.
//
// Change this one comparison to < and touching spans stay separate, which is
// right for ranges of distinct identifiers and wrong for calendar bookings.
func TouchesOrOverlaps(group, span Span) bool {
	return span.Start <= group.End
}

// SweepOnly sweeps without sorting. Correct only if the caller already sorted.
func SweepOnly(spans []Span) []Span {
	merged := []Span{}
	if len(spans) == 0 {
		return merged
	}

	merged = append(merged, spans[0])
	for _, span := range spans[1:] {
		group := &merged[len(merged)-1]
		if TouchesOrOverlaps(*group, span) {
			// Only the end moves, and it takes the larger of the two. Taking the
			// joining span's end shrinks the group whenever one span nests inside
			// another, which is the classic defect.
			if span.End > group.End {
				group.End = span.End
			}
		} else {
			merged = append(merged, span)
		}
	}

	return merged
}

// MergeSorted sorts by where each span begins, then sweeps once.
func MergeSorted(spans []Span) []Span {
	ordered := slices.Clone(spans)
	slices.SortFunc(ordered, func(left, right Span) int {
		return left.Start - right.Start
	})
	return SweepOnly(ordered)
}

// CoveredUnits reports the total length covered, from the merged spans.
func CoveredUnits(spans []Span) int {
	total := 0
	for _, span := range MergeSorted(spans) {
		total += span.End - span.Start
	}
	return total
}

// GapsBetween reports the free spaces between merged spans.
func GapsBetween(spans []Span) []Span {
	merged := MergeSorted(spans)
	gaps := []Span{}
	for at := 0; at+1 < len(merged); at++ {
		if merged[at+1].Start > merged[at].End {
			gaps = append(gaps, Span{Start: merged[at].End, End: merged[at+1].Start})
		}
	}
	return gaps
}

// CoveredByBruteForce checks every unit against every span. Far too slow, and a
// reference for the tests.
func CoveredByBruteForce(spans []Span, spanLimit int) int {
	total := 0
	for unit := 0; unit < spanLimit; unit++ {
		for _, span := range spans {
			if span.Start <= unit && unit < span.End {
				total++
				break
			}
		}
	}
	return total
}

// randomSpans builds a reproducible set of spans for the property tests.
func randomSpans(generator *rand.Rand, most int) []Span {
	spans := []Span{}
	for at := 0; at < generator.Intn(most); at++ {
		start := generator.Intn(19)
		spans = append(spans, Span{Start: start, End: start + generator.Intn(6)})
	}
	return spans
}
