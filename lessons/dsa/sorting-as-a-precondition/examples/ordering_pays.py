"""What ordering buys a later search, and what it costs to get it.

The sort itself is the language's own, because the lesson is about treating
order as a precondition rather than about how to establish it. What is measured
here is the work of the questions that follow.
"""

from typing import NamedTuple


class Probe(NamedTuple):
    """Where the value was found, and how many values were examined."""

    index: int | None
    comparisons: int


class Placed(NamedTuple):
    """A value and the position it occupied before anything was ordered."""

    value: int
    origin: int


def by_scan(values: list[int], target: int) -> Probe:
    """Examine values in the order given. Nothing rules anything out."""
    for index, value in enumerate(values):
        if value == target:
            return Probe(index, index + 1)
    return Probe(None, len(values))


def by_halving(values: list[int], target: int) -> Probe:
    """Halve the range each time. Correct only if `values` is ordered."""
    low, high = 0, len(values) - 1
    comparisons = 0

    while low <= high:
        middle = low + (high - low) // 2
        comparisons += 1
        if values[middle] == target:
            return Probe(middle, comparisons)
        if values[middle] < target:
            low = middle + 1
        else:
            high = middle - 1

    return Probe(None, comparisons)


def sorted_with_origin(values: list[int]) -> list[Placed]:
    """Order the values while carrying where each one started.

    Sorting values alone destroys the arrival order. Carrying the position is
    the only way back, and it has to be done before the sort, not after.
    Python's sort is stable, so equal values keep their original relative order.
    """
    placed = [Placed(value, origin) for origin, value in enumerate(values)]
    return sorted(placed, key=lambda entry: entry.value)
