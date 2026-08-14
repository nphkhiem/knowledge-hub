package examples

import (
	"slices"
	"testing"
)

var values = []int{5, 1, 8, 2, 3, 7}

const width = 3

func TestBothApproachesAgreeAtEveryWidth(t *testing.T) {
	for candidate := 1; candidate <= len(values); candidate++ {
		sliding := BySliding(values, candidate).Totals
		rescan := ByRescan(values, candidate).Totals
		if !slices.Equal(sliding, rescan) {
			t.Fatalf("width %d: sliding gave %v, rescan gave %v", candidate, sliding, rescan)
		}
	}
}

func TestTheLessonWindows(t *testing.T) {
	if got := BySliding(values, width).Totals; !slices.Equal(got, []int{14, 11, 13, 12}) {
		t.Fatalf("expected [14 11 13 12], got %v", got)
	}
}

func TestTheLargestWindowIsTheFirst(t *testing.T) {
	best, ok := BestWindowTotal(values, width)
	if !ok || best != 14 {
		t.Fatalf("expected 14, got %d (ok=%v)", best, ok)
	}
}

// The property the lesson teaches: a move removes one value and adds one,
// whatever the width.
func TestEveryMoveAfterTheFirstWindowCostsExactlyTwo(t *testing.T) {
	for candidate := 1; candidate <= len(values); candidate++ {
		scan := BySliding(values, candidate)
		moves := len(scan.Totals) - 1
		if scan.Operations-candidate != 2*moves {
			t.Fatalf("width %d: %d operations for %d moves", candidate, scan.Operations, moves)
		}
	}
}

func TestSlidingDoesLessArithmeticWhenThereIsOverlap(t *testing.T) {
	for candidate := 3; candidate < len(values); candidate++ {
		sliding := BySliding(values, candidate).Operations
		rescan := ByRescan(values, candidate).Operations
		if sliding >= rescan {
			t.Fatalf("width %d: sliding did %d, rescan did %d", candidate, sliding, rescan)
		}
	}
}

// A window as wide as the sequence never moves, so there is nothing to repair
// and both approaches do identical work.
func TestOneWindowSavesNothing(t *testing.T) {
	sliding := BySliding(values, len(values)).Operations
	rescan := ByRescan(values, len(values)).Operations
	if sliding != rescan {
		t.Fatalf("expected equal work, got %d and %d", sliding, rescan)
	}
}

// Honest edge: with nothing overlapping, the repair costs more than the rebuild
// it replaces.
func TestRepairingIsNotWorthItAtWidthOne(t *testing.T) {
	if BySliding(values, 1).Operations <= ByRescan(values, 1).Operations {
		t.Fatal("expected sliding to cost more at width one")
	}
}

func TestAWindowAsWideAsTheSequenceHasOnePosition(t *testing.T) {
	if got := BySliding(values, len(values)).Totals; !slices.Equal(got, []int{26}) {
		t.Fatalf("expected [26], got %v", got)
	}
}

func TestAWindowWiderThanTheSequenceHasNone(t *testing.T) {
	if got := BySliding(values, len(values)+1).Totals; len(got) != 0 {
		t.Fatalf("expected no windows, got %v", got)
	}
	if _, ok := BestWindowTotal(values, len(values)+1); ok {
		t.Fatal("expected no best window")
	}
}

func TestAnEmptySequenceHasNoWindows(t *testing.T) {
	if got := BySliding(nil, 3).Totals; len(got) != 0 {
		t.Fatalf("expected no windows, got %v", got)
	}
}

func TestAWidthOfZeroOrLessHasNoWindows(t *testing.T) {
	if got := WindowCount(len(values), 0); got != 0 {
		t.Fatalf("expected 0, got %d", got)
	}
	if got := ByRescan(values, -1).Totals; len(got) != 0 {
		t.Fatalf("expected no windows, got %v", got)
	}
}

func TestNegativeValuesRepairCorrectly(t *testing.T) {
	mixed := []int{4, -2, 6, -1}
	if !slices.Equal(BySliding(mixed, 2).Totals, ByRescan(mixed, 2).Totals) {
		t.Fatal("expected both approaches to agree on mixed signs")
	}
}
