// Package examples holds runnable lesson implementations.
package examples

// End marks the end of a chain of successor indices.
const End = -1

// MiddleByCounting measures, then walks to the middle. Two passes over the
// values. The second result is false when there is no middle.
func MiddleByCounting(values []int) (int, bool) {
	if len(values) == 0 {
		return 0, false
	}
	return len(values) / 2, true
}

// MiddleByTwoSpeeds advances one position per round and another two, in one
// pass with nothing counted.
//
// With an even number of values there are two candidate middles. This returns
// the later of them, which is a convention the tests pin.
func MiddleByTwoSpeeds(values []int) (int, bool) {
	if len(values) == 0 {
		return 0, false
	}

	slow, fast := 0, 0
	// The linked-list form is "while fast and fast.next", which here means the
	// fast position can still take a first step.
	for fast+1 < len(values) {
		slow++
		fast += 2
	}

	return slow, true
}

// StepsTaken reports how many rounds the two-speed walk takes, for the one-pass
// claim.
func StepsTaken(values []int) int {
	rounds, fast := 0, 0
	for fast+1 < len(values) {
		fast += 2
		rounds++
	}
	return rounds
}

// HasCycle reports whether following successors from start ever revisits a
// node. It uses two indices of memory whatever the chain's length.
func HasCycle(nexts []int, start int) bool {
	if len(nexts) == 0 {
		return false
	}

	slow, fast := start, start
	for {
		if fast == End || nexts[fast] == End {
			return false
		}
		slow = nexts[slow]
		fast = nexts[nexts[fast]]
		if slow == fast {
			return true
		}
	}
}

// CycleEntrance reports where the loop begins. The second result is false when
// there is no loop.
//
// The meeting point is not the entrance, so this runs a second phase: reset one
// position to the start and advance both one step at a time.
func CycleEntrance(nexts []int, start int) (int, bool) {
	if !HasCycle(nexts, start) {
		return 0, false
	}

	slow, fast := start, start
	for {
		slow = nexts[slow]
		fast = nexts[nexts[fast]]
		if slow == fast {
			break
		}
	}

	entrance := start
	for entrance != slow {
		entrance = nexts[entrance]
		slow = nexts[slow]
	}

	return entrance, true
}
