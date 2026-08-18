package examples

import "testing"

var readings = []int{2, 3, 1, 4, 2}

const budget = 6

func repeated(value, times int) []int {
	values := make([]int, times)
	for at := range values {
		values[at] = value
	}
	return values
}

func TestTheLessonReadings(t *testing.T) {
	if got := ByWindow(readings, budget).Width; got != 3 {
		t.Fatalf("expected 3, got %d", got)
	}
}

func TestTheWindowMatchesTheTruthOnNonNegativeValues(t *testing.T) {
	sequences := [][]int{nil, {5}, readings, {1, 1, 1, 1}, {0, 0, 4, 0}, {9, 9}}
	for _, values := range sequences {
		for limit := 0; limit <= 11; limit++ {
			if got, want := ByWindow(values, limit).Width, ByExhaustive(values, limit); got != want {
				t.Fatalf("%v within %d: window %d, truth %d", values, limit, got, want)
			}
			if got, want := ByWindow(values, limit).Width, ByEveryStart(values, limit).Width; got != want {
				t.Fatalf("%v within %d: window %d, every start %d", values, limit, got, want)
			}
		}
	}
}

// The property the lesson teaches. Each edge crosses the values once, so the
// total reads cannot exceed two per value however much the window grows and
// shrinks in between.
func TestEachValueIsReadAtMostTwice(t *testing.T) {
	for _, values := range [][]int{readings, repeated(1, 50), repeated(3, 8)} {
		if got := ByWindow(values, 6).Reads; got > 2*len(values) {
			t.Fatalf("read %d values of %d", got, len(values))
		}
	}
}

func TestTryingEveryStartCostsFarMore(t *testing.T) {
	forty := repeated(1, 40)
	if ByEveryStart(forty, 6).Reads <= 5*len(forty) {
		t.Fatal("expected trying every start to cost far more")
	}
}

func TestBudgetEdges(t *testing.T) {
	if got := ByWindow([]int{4, 5, 6}, 3).Width; got != 0 {
		t.Fatalf("expected nothing to fit, got %d", got)
	}
	if got := ByWindow(readings, 100).Width; got != len(readings) {
		t.Fatalf("expected everything to fit, got %d", got)
	}
	if got := ByWindow(nil, 6).Width; got != 0 {
		t.Fatalf("expected no stretch, got %d", got)
	}
	if got := ByWindow([]int{0, 0, 0}, 0).Width; got != 3 {
		t.Fatalf("expected zeros to extend for free, got %d", got)
	}
}

// Not a warning left in prose. The window returns a smaller answer than the
// truth, with nothing to indicate anything went wrong.
func TestANegativeValueMakesTheWindowWrong(t *testing.T) {
	negative := []int{5, -4, 1}
	if got := ByExhaustive(negative, 2); got != 3 {
		t.Fatalf("expected the truth to be 3, got %d", got)
	}
	if got := ByWindow(negative, 2).Width; got != 2 {
		t.Fatalf("expected the window to return 2, got %d", got)
	}
}
