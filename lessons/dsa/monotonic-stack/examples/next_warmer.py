"""How many days until a warmer one, by ordered pile and by comparing pairs.

Both answer the same question. The pile reads the days once; the pairwise
version compares every day with every later day, which is what the ordering
removes. Each reports how many comparisons it made.

A day with no warmer day after it has no answer, which is a result rather than
an error. Both return None for it rather than a sentinel that could be mistaken
for a real distance.
"""

from typing import NamedTuple


class Report(NamedTuple):
    """Days until warmer for each day, and the comparisons it took."""

    waits: list[int | None]
    comparisons: int


def by_comparing_pairs(highs: list[int]) -> Report:
    """Look ahead from every day. Correct, and grows with the square."""
    waits: list[int | None] = []
    comparisons = 0

    for day, high in enumerate(highs):
        found: int | None = None
        for later in range(day + 1, len(highs)):
            comparisons += 1
            if highs[later] > high:
                found = later - day
                break
        waits.append(found)

    return Report(waits, comparisons)


def by_ordered_pile(highs: list[int]) -> Report:
    """Keep unanswered days on a pile in decreasing order. One pass.

    The pile holds positions rather than temperatures, because the answer is a
    distance and a position can produce both. See the deep dive.
    """
    waits: list[int | None] = [None] * len(highs)
    waiting: list[int] = []
    comparisons = 0

    for day, high in enumerate(highs):
        # Everything this day answers is on top, because the pile is ordered.
        while waiting:
            comparisons += 1
            if highs[waiting[-1]] >= high:
                break
            answered = waiting.pop()
            waits[answered] = day - answered
        waiting.append(day)

    # Whatever is still waiting never found a warmer day. That is the answer.
    return Report(waits, comparisons)
