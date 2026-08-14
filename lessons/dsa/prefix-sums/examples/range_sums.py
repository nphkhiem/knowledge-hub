"""Range totals, computed directly and through prefix sums.

The prefix array carries a leading zero, so `prefix[i]` is the total of the
first i values and a range needs no special case when it starts at position 0.
"""


def build_prefix(values: list[int]) -> list[int]:
    """One pass. Entry i holds the total of the first i values."""
    prefix = [0]
    for value in values:
        prefix.append(prefix[-1] + value)
    return prefix


def range_total_by_scan(values: list[int], start: int, end: int) -> int:
    """Add the range every time it is asked for."""
    total = 0
    for index in range(start, end + 1):
        total += values[index]
    return total


def range_total_by_prefix(prefix: list[int], start: int, end: int) -> int:
    """Two reads and a subtraction, whatever the range covers."""
    return prefix[end + 1] - prefix[start]
