package examples

import "testing"

func TestStepsForPairwiseScan(t *testing.T) {
	// Four distinct items make 4 * 3 / 2 = 6 pairs.
	if got := StepsForPairwiseScan([]int{3, 8, 2, 5}); got != 6 {
		t.Fatalf("expected 6 steps, got %d", got)
	}
}

func TestPairwiseCostRoughlyQuadruples(t *testing.T) {
	four := StepsForPairwiseScan([]int{1, 2, 3, 4})
	eight := StepsForPairwiseScan([]int{1, 2, 3, 4, 5, 6, 7, 8})

	if four != 6 || eight != 28 {
		t.Fatalf("expected 6 and 28 steps, got %d and %d", four, eight)
	}
}

func TestStepsForSingleScan(t *testing.T) {
	if got := StepsForSingleScan([]int{3, 8, 2, 5}); got != 4 {
		t.Fatalf("expected 4 steps, got %d", got)
	}
}

func TestSingleCostDoubles(t *testing.T) {
	four := StepsForSingleScan([]int{1, 2, 3, 4})
	eight := StepsForSingleScan([]int{1, 2, 3, 4, 5, 6, 7, 8})

	if four != 4 || eight != 8 {
		t.Fatalf("expected 4 and 8 steps, got %d and %d", four, eight)
	}
}

func TestBothStopEarlyOnADuplicate(t *testing.T) {
	if got := StepsForPairwiseScan([]int{1, 1, 2, 3}); got != 1 {
		t.Fatalf("expected 1 step, got %d", got)
	}
	if got := StepsForSingleScan([]int{1, 1, 2, 3}); got != 2 {
		t.Fatalf("expected 2 steps, got %d", got)
	}
}

func TestEmptyInputSpendsNothing(t *testing.T) {
	if StepsForPairwiseScan(nil) != 0 || StepsForSingleScan(nil) != 0 {
		t.Fatal("expected an empty input to spend no steps")
	}
}
