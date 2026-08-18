package examples

import "testing"

var readings = []int{4, 8, 15, 16, 23, 42, 9}

func rangeOf(length int) []int {
	values := make([]int, length)
	for at := range values {
		values[at] = at
	}
	return values
}

// chain builds a straight chain of length nodes, ending rather than looping.
func chain(length int) []int {
	nexts := make([]int, length)
	for at := range nexts {
		if at == length-1 {
			nexts[at] = End
		} else {
			nexts[at] = at + 1
		}
	}
	return nexts
}

// looped builds a chain whose last node points back to entrance.
func looped(length, entrance int) []int {
	nexts := chain(length)
	nexts[length-1] = entrance
	return nexts
}

func TestTheLessonReadings(t *testing.T) {
	middle, ok := MiddleByTwoSpeeds(readings)
	if !ok || middle != 3 || readings[middle] != 16 {
		t.Fatalf("expected index 3 holding 16, got %d ok=%v", middle, ok)
	}
}

func TestBothWaysOfFindingTheMiddleAgree(t *testing.T) {
	for length := 1; length < 60; length++ {
		values := rangeOf(length)
		byTwo, okTwo := MiddleByTwoSpeeds(values)
		byCount, okCount := MiddleByCounting(values)
		if byTwo != byCount || okTwo != okCount {
			t.Fatalf("length %d: two speeds %d, counting %d", length, byTwo, byCount)
		}
	}
}

// The fast position takes two steps per round and stops at the end, so the
// rounds cannot exceed half the length. Nothing walks twice.
func TestItIsOnePass(t *testing.T) {
	for length := 1; length < 60; length++ {
		if got := StepsTaken(rangeOf(length)); got > (length+1)/2 {
			t.Fatalf("length %d took %d rounds", length, got)
		}
	}
}

// A convention rather than a discovery, pinned so a caller can rely on it.
func TestAnEvenLengthReturnsTheLaterMiddle(t *testing.T) {
	if got, _ := MiddleByTwoSpeeds([]int{0, 1, 2, 3}); got != 2 {
		t.Fatalf("expected 2, got %d", got)
	}
}

func TestEmptyAndSingle(t *testing.T) {
	if _, ok := MiddleByTwoSpeeds(nil); ok {
		t.Fatal("expected no middle in an empty sequence")
	}
	if got, ok := MiddleByTwoSpeeds([]int{9}); !ok || got != 0 {
		t.Fatalf("expected index 0, got %d", got)
	}
}

func TestAStraightChainHasNoCycle(t *testing.T) {
	for length := 1; length < 30; length++ {
		if HasCycle(chain(length), 0) {
			t.Fatalf("length %d reported a cycle", length)
		}
	}
}

// The meeting point is generally not the entrance. This checks the second phase
// against chains whose entrance is known by construction.
func TestALoopingChainHasOneAndItsEntranceIsFound(t *testing.T) {
	for length := 2; length < 30; length++ {
		for entrance := 0; entrance < length-1; entrance++ {
			nexts := looped(length, entrance)
			if !HasCycle(nexts, 0) {
				t.Fatalf("length %d entering at %d: no cycle found", length, entrance)
			}
			if got, ok := CycleEntrance(nexts, 0); !ok || got != entrance {
				t.Fatalf("length %d: expected entrance %d, got %d", length, entrance, got)
			}
		}
	}
}

func TestNoEntranceWithoutACycle(t *testing.T) {
	if _, ok := CycleEntrance(chain(10), 0); ok {
		t.Fatal("expected no entrance in a straight chain")
	}
}

func TestANodePointingAtItselfIsACycle(t *testing.T) {
	if !HasCycle([]int{0}, 0) {
		t.Fatal("expected a self-reference to be a cycle")
	}
	if got, ok := CycleEntrance([]int{0}, 0); !ok || got != 0 {
		t.Fatalf("expected entrance 0, got %d", got)
	}
}
