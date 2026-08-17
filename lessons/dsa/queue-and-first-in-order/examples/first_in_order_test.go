package examples

import (
	"slices"
	"testing"
)

var lesson = []string{"+report.pdf", "+photo.jpg", "-", "+notes.txt", "-", "-"}

// The defining property, over several event sequences rather than one.
func TestEverythingIsServedInArrivalOrder(t *testing.T) {
	sequences := [][]string{
		{"+a", "-"},
		lesson,
		{"+a", "+b", "+c", "-", "-", "-"},
		{"+a", "-", "+b", "-", "+c", "-"},
	}
	for _, events := range sequences {
		if got := ServeFirstIn(events); !slices.Equal(got, ArrivalsIn(events)) {
			t.Fatalf("events %v served %v, arrivals were %v", events, got, ArrivalsIn(events))
		}
	}
}

func TestTheLessonOrder(t *testing.T) {
	want := []string{"report.pdf", "photo.jpg", "notes.txt"}
	if got := ServeFirstIn(lesson); !slices.Equal(got, want) {
		t.Fatalf("expected %v, got %v", want, got)
	}
}

// The contrast the two lessons exist to draw, on identical input.
func TestAPileGivenTheSameEventsServesADifferentOrder(t *testing.T) {
	want := []string{"photo.jpg", "notes.txt", "report.pdf"}
	if got := ServeLastIn(lesson); !slices.Equal(got, want) {
		t.Fatalf("expected %v, got %v", want, got)
	}
}

// notes.txt arrives after photo.jpg is already waiting and is served after it.
// This is the step where the pile does the opposite.
func TestALateArrivalDoesNotOvertakeOneAlreadyWaiting(t *testing.T) {
	served := ServeFirstIn(lesson)
	if slices.Index(served, "photo.jpg") > slices.Index(served, "notes.txt") {
		t.Fatal("expected the earlier arrival to be served first")
	}
	piled := ServeLastIn(lesson)
	if slices.Index(piled, "notes.txt") > slices.Index(piled, "report.pdf") {
		t.Fatal("expected the pile to serve the newer arrival first")
	}
}

// Not "may be delayed": under alternating arrivals and services a pile never
// serves the first item at all, for any number of rounds.
func TestASteadyStreamNeverStarvesTheFirstArrival(t *testing.T) {
	for _, rounds := range []int{1, 5, 50} {
		events := SteadyStream("first", rounds)
		if !slices.Contains(ServeFirstIn(events), "first") {
			t.Fatalf("a queue failed to serve the first arrival over %d rounds", rounds)
		}
		if slices.Contains(ServeLastIn(events), "first") {
			t.Fatalf("a pile unexpectedly served the first arrival over %d rounds", rounds)
		}
	}
}

func TestTheQueueServesTheFirstArrivalImmediately(t *testing.T) {
	if got := ServeFirstIn(SteadyStream("first", 5))[0]; got != "first" {
		t.Fatalf("expected first, got %s", got)
	}
}

func TestServingAnEmptyLineDoesNothing(t *testing.T) {
	if got := ServeFirstIn([]string{"-", "-"}); len(got) != 0 {
		t.Fatalf("expected nobody served, got %v", got)
	}
	if got := ServeFirstIn([]string{"-", "+a", "-"}); !slices.Equal(got, []string{"a"}) {
		t.Fatalf("expected [a], got %v", got)
	}
}

func TestUnservedArrivalsAreSimplyNotServed(t *testing.T) {
	if got := ServeFirstIn([]string{"+a", "+b", "-"}); !slices.Equal(got, []string{"a"}) {
		t.Fatalf("expected [a], got %v", got)
	}
}

func TestNoEventsServeNobody(t *testing.T) {
	if len(ServeFirstIn(nil)) != 0 || len(ServeLastIn(nil)) != 0 {
		t.Fatal("expected nobody served")
	}
}

func TestRepeatedNamesAreOrdinary(t *testing.T) {
	got := ServeFirstIn([]string{"+job", "+job", "-", "-"})
	if !slices.Equal(got, []string{"job", "job"}) {
		t.Fatalf("expected two jobs, got %v", got)
	}
}
