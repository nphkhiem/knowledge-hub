package examples

import (
	"slices"
	"testing"
)

var (
	arrived = []int{38, 5, 91, 23, 8}
	ordered = []int{5, 8, 23, 38, 91}
)

func rangeOf(size int) []int {
	values := make([]int, size)
	for at := range values {
		values[at] = at
	}
	return values
}

func worstHalving(values []int) int {
	worst := 0
	for _, value := range values {
		if got := ByHalving(values, value).Comparisons; got > worst {
			worst = got
		}
	}
	return worst
}

func valuesOf(placed []Placed) []int {
	out := make([]int, 0, len(placed))
	for _, entry := range placed {
		out = append(out, entry.Value)
	}
	return out
}

func originsOf(placed []Placed) []int {
	out := make([]int, 0, len(placed))
	for _, entry := range placed {
		out = append(out, entry.Origin)
	}
	return out
}

func TestTheLessonSearch(t *testing.T) {
	if got := ByScan(arrived, 8); got.Index != 4 || got.Comparisons != 5 {
		t.Fatalf("expected index 4 in 5 comparisons, got %+v", got)
	}
	if got := ByHalving(ordered, 8); got.Index != 1 || !got.Found {
		t.Fatalf("expected index 1, got %+v", got)
	}
}

// The reason this is a precondition rather than a step. Given the same values
// in arrival order, the halving search reports the value absent. It does not
// fail or complain; it returns a confident wrong answer.
func TestHalvingOnUnorderedValuesSilentlyLies(t *testing.T) {
	if ByHalving(arrived, 8).Found {
		t.Fatal("expected the halving search to miss 8 in arrival order")
	}
	if !ByScan(arrived, 8).Found {
		t.Fatal("expected a scan to find 8 in arrival order")
	}
}

func TestScanningExaminesEveryValueInTheWorstCase(t *testing.T) {
	for _, absent := range []int{0, 100} {
		if got := ByScan(arrived, absent).Comparisons; got != len(arrived) {
			t.Fatalf("expected %d comparisons, got %d", len(arrived), got)
		}
	}
}

func TestOrderingMakesTheQuestionCheaperTheLargerItGets(t *testing.T) {
	small := rangeOf(128)
	large := rangeOf(1024)

	// Eight times the values, three more comparisons, not eight times as many.
	if got := worstHalving(large) - worstHalving(small); got != 3 {
		t.Fatalf("expected three more comparisons, got %d", got)
	}
	if got := ByScan(large, 1023).Comparisons; got != 1024 {
		t.Fatalf("expected a full scan of 1024, got %d", got)
	}
	if got := worstHalving(large); got != 11 {
		t.Fatalf("expected 11 halvings, got %d", got)
	}
}

// A scan reads at most every value once. Any sort must read every value at
// least once, so for a single question the scan cannot lose.
func TestOneQuestionDoesNotRepayTheOrdering(t *testing.T) {
	values := rangeOf(512)
	if ByScan(values, 511).Comparisons > len(values) {
		t.Fatal("expected a scan to read no more than every value")
	}
}

func TestCarryingThePositionIsTheOnlyWayBack(t *testing.T) {
	placed := SortedWithOrigin(arrived)
	if !slices.Equal(valuesOf(placed), ordered) {
		t.Fatalf("expected %v, got %v", ordered, valuesOf(placed))
	}
	if want := []int{1, 4, 3, 0, 2}; !slices.Equal(originsOf(placed), want) {
		t.Fatalf("expected origins %v, got %v", want, originsOf(placed))
	}
}

// Stability, stated as a test. The two 7s must come back in the order they
// arrived, which is what lets two sorts be combined.
func TestEqualValuesKeepTheirArrivalOrder(t *testing.T) {
	sevens := []int{}
	for _, entry := range SortedWithOrigin([]int{7, 3, 7, 1}) {
		if entry.Value == 7 {
			sevens = append(sevens, entry.Origin)
		}
	}
	if !slices.Equal(sevens, []int{0, 2}) {
		t.Fatalf("expected [0 2], got %v", sevens)
	}
}

func TestEmptyAndSingleCollections(t *testing.T) {
	if len(SortedWithOrigin(nil)) != 0 {
		t.Fatal("expected an empty collection to order to nothing")
	}
	if ByHalving(nil, 1).Found {
		t.Fatal("expected nothing found in an empty collection")
	}
	if got := ByHalving([]int{9}, 9); got.Index != 0 || !got.Found {
		t.Fatalf("expected index 0, got %+v", got)
	}
}
