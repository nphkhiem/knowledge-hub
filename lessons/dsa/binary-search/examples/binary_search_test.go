package examples

import (
	"math"
	"testing"
)

var sorted = []int{2, 5, 8, 12, 16, 23, 38, 56, 72, 91}

func rangeOf(size int) []int {
	values := make([]int, size)
	for at := range values {
		values[at] = at
	}
	return values
}

func worst(values []int, targets ...int) int {
	most := 0
	for _, target := range targets {
		if probes := ByHalving(values, target).Probes; probes > most {
			most = probes
		}
	}
	return most
}

// Deliberately not "the same index as a scan": with duplicates the two can
// differ and both be right. What must hold is that the answer is an answer.
func TestFindsAPositionHoldingEveryValuePresent(t *testing.T) {
	for _, value := range sorted {
		found := ByHalving(sorted, value)
		if !found.Found || sorted[found.Index] != value {
			t.Fatalf("searching %d gave %+v", value, found)
		}
	}
}

func TestAgreesWithAScanAboutWhatIsAbsent(t *testing.T) {
	for _, absent := range []int{-4, 0, 1, 3, 24, 90, 92, 1000} {
		if ByHalving(sorted, absent).Found || ByScan(sorted, absent).Found {
			t.Fatalf("expected %d to be absent", absent)
		}
	}
}

func TestTheLessonSearch(t *testing.T) {
	if got := ByHalving(sorted, 23); got.Index != 5 || !got.Found || got.Probes != 3 {
		t.Fatalf("expected index 5 in 3 probes, got %+v", got)
	}
}

// The claim the lesson makes, as a bound rather than an anecdote.
func TestNeverExaminesMoreThanTheHalvingsAllow(t *testing.T) {
	bound := int(math.Log2(float64(len(sorted)))) + 1
	for _, target := range []int{2, 23, 91, -1, 7, 100} {
		if probes := ByHalving(sorted, target).Probes; probes > bound {
			t.Fatalf("searching %d took %d probes, bound is %d", target, probes, bound)
		}
	}
}

func TestAScanExaminesFarMoreAtTheFarEnd(t *testing.T) {
	last := sorted[len(sorted)-1]
	if ByScan(sorted, last).Probes <= ByHalving(sorted, last).Probes {
		t.Fatal("expected the scan to examine more values")
	}
}

func TestDoublingTheInputAddsOneLook(t *testing.T) {
	got := worst(rangeOf(2048), 0, 1023, 2047) - worst(rangeOf(1024), 0, 511, 1023)
	if got != 1 {
		t.Fatalf("expected one extra look, got %d", got)
	}
}

func TestFindsBothEnds(t *testing.T) {
	if got := ByHalving(sorted, sorted[0]); got.Index != 0 {
		t.Fatalf("expected index 0, got %+v", got)
	}
	if got := ByHalving(sorted, sorted[len(sorted)-1]); got.Index != len(sorted)-1 {
		t.Fatalf("expected the last index, got %+v", got)
	}
}

func TestAnEmptySequenceHoldsNothing(t *testing.T) {
	if got := ByHalving(nil, 3); got.Found || got.Probes != 0 {
		t.Fatalf("expected nothing found in no probes, got %+v", got)
	}
}

func TestASingleValueSequence(t *testing.T) {
	if got := ByHalving([]int{7}, 7); !got.Found || got.Index != 0 {
		t.Fatalf("expected index 0, got %+v", got)
	}
	if ByHalving([]int{7}, 8).Found {
		t.Fatal("expected 8 to be absent")
	}
}

func TestDuplicatesReturnAPositionHoldingTheTarget(t *testing.T) {
	repeated := []int{1, 4, 4, 4, 9}
	found := ByHalving(repeated, 4)
	if !found.Found || repeated[found.Index] != 4 {
		t.Fatalf("expected a position holding 4, got %+v", found)
	}
}

func TestNegativeValuesAreOrderedToo(t *testing.T) {
	signed := []int{-9, -4, -1, 0, 6}
	for _, value := range signed {
		found := ByHalving(signed, value)
		if !found.Found || signed[found.Index] != value {
			t.Fatalf("searching %d gave %+v", value, found)
		}
	}
}
