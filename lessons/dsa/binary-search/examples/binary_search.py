"""Searching a sorted sequence by halving, and by scanning it.

Both functions answer the same question. They differ in how many values they
look at to answer it, which is the point of the lesson, so each reports the
number of values it examined.
"""

from typing import NamedTuple


class Search(NamedTuple):
    """Where the value was found, and how many values were examined."""

    index: int | None
    probes: int


def by_scan(values: list[int], target: int) -> Search:
    """Walk from one end, ignoring the order the values are already in."""
    for index, value in enumerate(values):
        if value == target:
            return Search(index, index + 1)
    return Search(None, len(values))


def by_halving(values: list[int], target: int) -> Search:
    """Keep the range that could still hold the target, and halve it."""
    low, high = 0, len(values) - 1
    probes = 0

    while low <= high:
        # low + (high - low) // 2, not (low + high) // 2. The sum can overflow
        # a fixed-width integer; the offset cannot. See the deep dive.
        middle = low + (high - low) // 2
        probes += 1
        if values[middle] == target:
            return Search(middle, probes)
        if values[middle] < target:
            low = middle + 1
        else:
            high = middle - 1

    return Search(None, probes)
