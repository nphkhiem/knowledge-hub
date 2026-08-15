package examples

import (
	"slices"
	"strings"
	"testing"
)

var work = []string{"render page", "lay out list", "measure row"}

func reversed(items []string) []string {
	out := slices.Clone(items)
	slices.Reverse(out)
	return out
}

// The defining property, over many inputs rather than one. A structure that
// failed this would not be a stack whatever its methods were named.
func TestWhatComesOutIsWhatWentInReversed(t *testing.T) {
	inputs := [][]string{
		{},
		{"only"},
		work,
		{"a", "b", "c", "d", "e", "f"},
		{"same", "same", "same"},
	}
	for _, items := range inputs {
		if got := Drain(items); !slices.Equal(got, reversed(items)) {
			t.Fatalf("draining %v gave %v", items, got)
		}
	}
}

func TestTheLessonOrder(t *testing.T) {
	want := []string{"measure row", "lay out list", "render page"}
	if got := Drain(work); !slices.Equal(got, want) {
		t.Fatalf("expected %v, got %v", want, got)
	}
}

func TestDrainingTwiceRestoresTheOriginalOrder(t *testing.T) {
	if got := Drain(Drain(work)); !slices.Equal(got, work) {
		t.Fatalf("expected %v, got %v", work, got)
	}
}

func TestBalancedNestingIsAccepted(t *testing.T) {
	for _, text := range []string{"", "()", "([{}])", "a(b)c[d]e", "(())()"} {
		if !IsBalanced(text) {
			t.Fatalf("expected %q to be balanced", text)
		}
	}
}

func TestUnbalancedNestingIsRejected(t *testing.T) {
	// The last case is the one a counter of opens and closes cannot detect: the
	// counts match and the nesting is still wrong.
	for _, text := range []string{")", "())", "(", "([)", "([)]"} {
		if IsBalanced(text) {
			t.Fatalf("expected %q to be rejected", text)
		}
	}
	if strings.Count("([)]", "(")+strings.Count("([)]", "[") != 2 {
		t.Fatal("expected two openers in the counting counterexample")
	}
}

// A thousand pairs in sequence never need more than one slot; ten nested need
// ten. This is why recursion depth is the thing to reason about.
func TestDepthGrowsWithNestingNotWithLength(t *testing.T) {
	if got := DeepestNesting(strings.Repeat("()", 1000)); got != 1 {
		t.Fatalf("expected depth 1, got %d", got)
	}
	nested := strings.Repeat("(", 10) + strings.Repeat(")", 10)
	if got := DeepestNesting(nested); got != 10 {
		t.Fatalf("expected depth 10, got %d", got)
	}
}

func TestTextWithoutBracketsIsBalancedAndFlat(t *testing.T) {
	if !IsBalanced("no brackets here") || DeepestNesting("no brackets here") != 0 {
		t.Fatal("expected plain text to be balanced and flat")
	}
}
