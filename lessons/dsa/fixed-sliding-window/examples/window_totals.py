"""Totals of every fixed-width window, rebuilt and repaired.

Both functions answer the same question and return the same totals. They differ
only in how much arithmetic they do to get there, which is the point of the
lesson, so each also reports the number of additions and subtractions it
performed.
"""

from typing import NamedTuple


class WindowScan(NamedTuple):
    """The total of each window, and the arithmetic it cost to produce them."""

    totals: list[int]
    operations: int


def window_count(length: int, width: int) -> int:
    """Windows of `width` that fit in `length` values, never fewer than zero.

    A width larger than the sequence yields no windows at all rather than one
    short window, because a partial window answers a different question.
    """
    if width <= 0:
        return 0
    return max(0, length - width + 1)


def by_rescan(values: list[int], width: int) -> WindowScan:
    """Add every window from scratch. Costs `width` additions per window."""
    totals: list[int] = []
    operations = 0
    for start in range(window_count(len(values), width)):
        total = 0
        for index in range(start, start + width):
            total += values[index]
            operations += 1
        totals.append(total)
    return WindowScan(totals, operations)


def by_sliding(values: list[int], width: int) -> WindowScan:
    """Build the first window, then repair it. Each move costs exactly two."""
    count = window_count(len(values), width)
    if count == 0:
        return WindowScan([], 0)

    total = 0
    operations = 0
    for index in range(width):
        total += values[index]
        operations += 1

    totals = [total]
    for start in range(1, count):
        total -= values[start - 1]
        total += values[start + width - 1]
        operations += 2
        totals.append(total)
    return WindowScan(totals, operations)


def best_window_total(values: list[int], width: int) -> int | None:
    """The largest window total, or None when no window fits."""
    totals = by_sliding(values, width).totals
    return max(totals) if totals else None
