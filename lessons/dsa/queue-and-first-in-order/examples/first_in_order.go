// Package examples holds runnable lesson implementations.
package examples

import (
	"fmt"
	"strings"
)

func isArrival(event string) bool {
	return strings.HasPrefix(event, "+")
}

// ServeFirstIn serves the end that has waited longest. This is a queue.
//
// The line is a plain slice, so serving the front reslices rather than using a
// ring buffer. That is the clearest form for showing an order and not the one
// to reach for in real use. See the deep dive.
func ServeFirstIn(events []string) []string {
	waiting := []string{}
	served := []string{}

	for _, event := range events {
		if isArrival(event) {
			waiting = append(waiting, event[1:])
		} else if len(waiting) > 0 {
			served = append(served, waiting[0])
			waiting = waiting[1:]
		}
	}

	return served
}

// ServeLastIn serves the most recent arrival. This is a stack, shown for
// contrast: it differs from ServeFirstIn by one line.
func ServeLastIn(events []string) []string {
	waiting := []string{}
	served := []string{}

	for _, event := range events {
		if isArrival(event) {
			waiting = append(waiting, event[1:])
		} else if len(waiting) > 0 {
			served = append(served, waiting[len(waiting)-1])
			waiting = waiting[:len(waiting)-1]
		}
	}

	return served
}

// ArrivalsIn reports the names that arrived, in the order they did.
func ArrivalsIn(events []string) []string {
	arrivals := []string{}
	for _, event := range events {
		if isArrival(event) {
			arrivals = append(arrivals, event[1:])
		}
	}
	return arrivals
}

// SteadyStream builds one early arrival, then arrivals and services
// alternating forever after.
func SteadyStream(first string, rounds int) []string {
	events := []string{"+" + first}
	for round := 0; round < rounds; round++ {
		events = append(events, fmt.Sprintf("+later-%d", round), "-")
	}
	return events
}
