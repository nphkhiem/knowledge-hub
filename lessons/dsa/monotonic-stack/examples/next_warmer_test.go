package examples

import (
	"slices"
	"testing"
)

var highs = []int{30, 28, 33, 31, 35}

func rising(length int) []int {
	values := make([]int, length)
	for at := range values {
		values[at] = at
	}
	return values
}

func falling(length int) []int {
	values := make([]int, length)
	for at := range values {
		values[at] = length - at
	}
	return values
}

func TestTheLessonReadings(t *testing.T) {
	want := []Wait{{2, true}, {1, true}, {2, true}, {1, true}, {}}
	if got := ByOrderedPile(highs).Waits; !slices.Equal(got, want) {
		t.Fatalf("expected %v, got %v", want, got)
	}
}

func TestBothApproachesAgree(t *testing.T) {
	shapes := [][]int{
		nil, {5}, highs, {1, 2, 3, 4}, {4, 3, 2, 1},
		{7, 7, 7}, {2, 1, 2, 1, 2}, {10, 1, 9, 2, 8, 3},
	}
	for _, shape := range shapes {
		if !slices.Equal(ByOrderedPile(shape).Waits, ByComparingPairs(shape).Waits) {
			t.Fatalf("disagreed on %v", shape)
		}
	}
}

// The claim the lesson makes. One reading can pop many, so the bound is over
// the whole pass rather than any single step.
func TestEveryDayIsPushedOnceAndPoppedAtMostOnce(t *testing.T) {
	for _, length := range []int{1, 5, 20, 60} {
		for _, shape := range [][]int{rising(length), falling(length)} {
			if got := ByOrderedPile(shape).Comparisons; got > 2*len(shape) {
				t.Fatalf("length %d took %d comparisons", length, got)
			}
		}
	}
}

// The worst case for pairs: no day is ever answered, so every day looks at
// every later day.
func TestComparingPairsCostsFarMoreOnAFallingSequence(t *testing.T) {
	steep := falling(40)
	if ByComparingPairs(steep).Comparisons <= 10*len(steep) {
		t.Fatal("expected comparing pairs to be far more expensive")
	}
	if ByOrderedPile(steep).Comparisons > 2*len(steep) {
		t.Fatal("expected the pile to stay linear")
	}
}

func TestAFallingSequenceAnswersNobody(t *testing.T) {
	if got := ByOrderedPile([]int{5, 4, 3}).Waits; !slices.Equal(got, []Wait{{}, {}, {}}) {
		t.Fatalf("expected nobody answered, got %v", got)
	}
}

// Warmer means strictly warmer. Equal temperatures leave both waiting.
func TestEqualDaysDoNotAnswerEachOther(t *testing.T) {
	want := []Wait{{2, true}, {1, true}, {}}
	if got := ByOrderedPile([]int{7, 7, 8}).Waits; !slices.Equal(got, want) {
		t.Fatalf("expected %v, got %v", want, got)
	}
}

// A result rather than an error, and distinct from a distance of zero.
func TestTheLastDayNeverHasAnAnswer(t *testing.T) {
	for _, shape := range [][]int{highs, {1, 2, 3}, {3, 2, 1}, {9}} {
		waits := ByOrderedPile(shape).Waits
		if waits[len(waits)-1].Found {
			t.Fatalf("the last day of %v was answered", shape)
		}
	}
}

func TestAnEmptyHistory(t *testing.T) {
	if got := ByOrderedPile(nil); len(got.Waits) != 0 || got.Comparisons != 0 {
		t.Fatalf("expected an empty report, got %+v", got)
	}
}
