package examples

import "testing"

func TestFindPairWithSum(t *testing.T) {
	cases := []struct {
		name      string
		values    []int
		target    int
		wantLeft  int
		wantRight int
		wantFound bool
	}{
		{"finds the pair the lesson animates", []int{1, 2, 4, 7, 11, 15}, 15, 2, 4, true},
		{"reports no pair for an empty slice rather than guessing", []int{}, 5, 0, 0, false},
		{"reports no pair when none sums to the target", []int{1, 2, 4, 7, 11, 15}, 100, 0, 0, false},
		{"reports no pair for a single-element slice", []int{5}, 5, 0, 0, false},
		{"handles an adjacent pair", []int{3, 4}, 7, 0, 1, true},
		{"handles a pair at both endpoints", []int{1, 9, 9, 9, 10}, 11, 0, 4, true},
		{"handles negative values", []int{-8, -3, 0, 2, 5}, -3, 0, 4, true},
		{"does not pair the same element with itself", []int{4, 8}, 8, 0, 0, false},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			left, right, found := FindPairWithSum(c.values, c.target)
			if left != c.wantLeft || right != c.wantRight || found != c.wantFound {
				t.Errorf(
					"FindPairWithSum(%v, %d) = (%d, %d, %v), want (%d, %d, %v)",
					c.values, c.target, left, right, found, c.wantLeft, c.wantRight, c.wantFound,
				)
			}
		})
	}
}
