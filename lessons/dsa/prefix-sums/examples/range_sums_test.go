package examples

import "testing"

var values = []int{3, 1, 4, 1, 5, 9}

func TestBothApproachesAgreeOnEveryRange(t *testing.T) {
	prefix := BuildPrefix(values)
	for start := range values {
		for end := start; end < len(values); end++ {
			byPrefix := RangeTotalByPrefix(prefix, start, end)
			byScan := RangeTotalByScan(values, start, end)
			if byPrefix != byScan {
				t.Fatalf("range %d..%d: prefix gave %d, scan gave %d", start, end, byPrefix, byScan)
			}
		}
	}
}

func TestTheLessonRangeTotalsTen(t *testing.T) {
	if got := RangeTotalByPrefix(BuildPrefix(values), 2, 4); got != 10 {
		t.Fatalf("expected 10, got %d", got)
	}
}

func TestARangeStartingAtZeroNeedsNoSpecialCase(t *testing.T) {
	if got := RangeTotalByPrefix(BuildPrefix(values), 0, 0); got != 3 {
		t.Fatalf("expected 3, got %d", got)
	}
}

func TestTheWholeSequence(t *testing.T) {
	if got := RangeTotalByPrefix(BuildPrefix(values), 0, len(values)-1); got != 23 {
		t.Fatalf("expected 23, got %d", got)
	}
}

func TestPrefixIsOneLongerThanTheValues(t *testing.T) {
	if got := len(BuildPrefix(values)); got != len(values)+1 {
		t.Fatalf("expected %d entries, got %d", len(values)+1, got)
	}
}

func TestAnEmptySequenceHasASingleZeroPrefix(t *testing.T) {
	prefix := BuildPrefix(nil)
	if len(prefix) != 1 || prefix[0] != 0 {
		t.Fatalf("expected a single zero, got %v", prefix)
	}
}

func TestNegativeValuesStillSubtractCorrectly(t *testing.T) {
	if got := RangeTotalByPrefix(BuildPrefix([]int{5, -3, 2}), 0, 2); got != 4 {
		t.Fatalf("expected 4, got %d", got)
	}
}
