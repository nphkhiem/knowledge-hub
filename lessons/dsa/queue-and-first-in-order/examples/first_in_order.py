"""First-in, first-out order, against the last-in order of a pile.

Both functions read the same events and differ only in which end they serve.
That single difference is the whole lesson, so the functions are deliberately
identical except for one line each.

An event is either an arrival, written "+name", or a service, written "-".

The line is a plain list, so serving the front shifts everything down and costs
the length rather than a constant. That is the wrong implementation for real
use and the clearest one for showing an order. See the deep dive.
"""


def serve_first_in(events: list[str]) -> list[str]:
    """Serve the end that has waited longest. This is a queue."""
    waiting: list[str] = []
    served: list[str] = []

    for event in events:
        if event.startswith("+"):
            waiting.append(event[1:])
        elif waiting:
            served.append(waiting.pop(0))

    return served


def serve_last_in(events: list[str]) -> list[str]:
    """Serve the most recent arrival. This is a stack, shown for contrast."""
    waiting: list[str] = []
    served: list[str] = []

    for event in events:
        if event.startswith("+"):
            waiting.append(event[1:])
        elif waiting:
            served.append(waiting.pop())

    return served


def arrivals_in(events: list[str]) -> list[str]:
    """The names that arrived, in the order they did."""
    return [event[1:] for event in events if event.startswith("+")]


def steady_stream(first: str, rounds: int) -> list[str]:
    """One early arrival, then arrivals and services alternating forever."""
    events = [f"+{first}"]
    for round_number in range(rounds):
        events.append(f"+later-{round_number}")
        events.append("-")
    return events
