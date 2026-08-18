"""The longest stretch whose total stays within a budget, in one pass.

Both functions answer the same question. One tries every start position and
extends from it; the other moves two edges that never go backward. Each reports
how many values it looked at, because the difference between them is the point.

Both assume non-negative values. `by_exhaustive` assumes nothing and is far too
slow to use, which is exactly what makes it a reference: the tests below compare
against it to show that the window is correct on non-negative values and wrong
on values that break the assumption.
"""

from typing import NamedTuple


class Search(NamedTuple):
    """The longest width found, and how many values were examined."""

    width: int
    reads: int


def by_every_start(values: list[int], budget: int) -> Search:
    """Try each start position and extend from it. Re-reads what it already saw."""
    best = 0
    reads = 0

    for start in range(len(values)):
        total = 0
        for end in range(start, len(values)):
            total += values[end]
            reads += 1
            if total > budget:
                break
            best = max(best, end - start + 1)

    return Search(best, reads)


def by_window(values: list[int], budget: int) -> Search:
    """Move two edges, neither ever backward. One pass over the values."""
    best = 0
    total = 0
    start = 0
    reads = 0

    for end in range(len(values)):
        total += values[end]
        reads += 1

        # The front edge comes up only while the budget is broken, and stops as
        # soon as it holds. Both halves need the condition to be one-way.
        while total > budget and start <= end:
            total -= values[start]
            reads += 1
            start += 1

        best = max(best, end - start + 1)

    return Search(best, reads)


def by_exhaustive(values: list[int], budget: int) -> int:
    """Every stretch, with no early exit. Correct on any values, and far too
    slow to use. It exists so the tests have something to be right against."""
    best = 0

    for start in range(len(values)):
        for end in range(start, len(values)):
            if sum(values[start : end + 1]) <= budget:
                best = max(best, end - start + 1)

    return best
