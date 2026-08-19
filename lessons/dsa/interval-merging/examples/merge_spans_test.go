package examples

import (
	"math/rand"
	"slices"
	"testing"
)

var bookings = []Span{{1, 3}, {2, 6}, {5, 8}, {10, 12}, {11, 13}}

func TestTheLessonBookings(t *testing.T) {
	want := []Span{{1, 8}, {10, 13}}
	if got := MergeSorted(bookings); !slices.Equal(got, want) {
		t.Fatalf("expected %v, got %v", want, got)
	}
}

func TestAGapClosesAGroup(t *testing.T) {
	if got := GapsBetween(bookings); !slices.Equal(got, []Span{{8, 10}}) {
		t.Fatalf("expected one gap, got %v", got)
	}
}

// The classic defect: taking the joining span's end rather than the larger of
// the two. Invisible until one span nests inside another.
func TestASpanInsideAnotherDoesNotShrinkIt(t *testing.T) {
	if got := MergeSorted([]Span{{1, 9}, {2, 4}}); !slices.Equal(got, []Span{{1, 9}}) {
		t.Fatalf("expected [{1 9}], got %v", got)
	}
}

// A decision rather than a fact, pinned so a caller knows which.
func TestTouchingSpansMerge(t *testing.T) {
	if got := MergeSorted([]Span{{1, 4}, {4, 7}}); !slices.Equal(got, []Span{{1, 7}}) {
		t.Fatalf("expected [{1 7}], got %v", got)
	}
}

// Not a warning in prose. The unsorted sweep returns a plausible, shorter list
// of real spans, and it is wrong.
func TestTheSortIsAPrecondition(t *testing.T) {
	shuffled := []Span{{10, 12}, {1, 3}, {2, 6}}
	if got := MergeSorted(shuffled); !slices.Equal(got, []Span{{1, 6}, {10, 12}}) {
		t.Fatalf("expected the sorted answer, got %v", got)
	}
	if slices.Equal(SweepOnly(shuffled), MergeSorted(shuffled)) {
		t.Fatal("expected the unsorted sweep to differ")
	}
}

// The property, against a reference too slow to use, over random input.
func TestMergingAgreesWithCountingEveryUnit(t *testing.T) {
	generator := rand.New(rand.NewSource(11))
	for attempt := 0; attempt < 200; attempt++ {
		spans := randomSpans(generator, 7)
		if CoveredUnits(spans) != CoveredByBruteForce(spans, 30) {
			t.Fatalf("disagreed on %v", spans)
		}
	}
}

func TestMergedSpansComeOutSortedAndDisjoint(t *testing.T) {
	generator := rand.New(rand.NewSource(29))
	for attempt := 0; attempt < 200; attempt++ {
		spans := randomSpans(generator, 6)
		merged := MergeSorted(spans)
		for at := 0; at+1 < len(merged); at++ {
			// Sorted, and separated by a real gap rather than touching.
			if merged[at].End >= merged[at+1].Start {
				t.Fatalf("%v merged to %v", spans, merged)
			}
		}
	}
}

func TestEdges(t *testing.T) {
	if got := MergeSorted(nil); len(got) != 0 {
		t.Fatalf("expected nothing, got %v", got)
	}
	if got := MergeSorted([]Span{{2, 5}, {2, 5}, {2, 5}}); !slices.Equal(got, []Span{{2, 5}}) {
		t.Fatalf("expected one span, got %v", got)
	}
	// A booking of no duration is still a real record.
	if got := MergeSorted([]Span{{4, 4}}); !slices.Equal(got, []Span{{4, 4}}) {
		t.Fatalf("expected the zero length span kept, got %v", got)
	}
}
