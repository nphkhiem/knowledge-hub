"""Combining overlapping spans, and what happens without the sort.

`merge_sorted` is the real implementation: sort by start, sweep once. `sweep_only`
is the same sweep with the sort removed, which is not a warning in prose but a
function whose wrong answers the tests check.

Spans that merely touch are merged here. That is a decision rather than a fact,
so the comparison is named once and used everywhere.
"""

Span = tuple[int, int]


def touches_or_overlaps(group: Span, span: Span) -> bool:
    """Whether `span` can join `group`, given both start no earlier than it.

    Change this one comparison to `<` and touching spans stay separate, which is
    the right choice for ranges of distinct identifiers and the wrong one for
    calendar bookings. See the deep dive.
    """
    return span[0] <= group[1]


def sweep_only(spans: list[Span]) -> list[Span]:
    """Sweep without sorting. Correct only if the caller already sorted."""
    if not spans:
        return []

    merged = [spans[0]]
    for span in spans[1:]:
        group = merged[-1]
        if touches_or_overlaps(group, span):
            # Only the end moves, and it takes the larger of the two. Taking
            # `span[1]` instead is the classic defect: it shrinks the group
            # whenever one span sits entirely inside another.
            merged[-1] = (group[0], max(group[1], span[1]))
        else:
            merged.append(span)

    return merged


def merge_sorted(spans: list[Span]) -> list[Span]:
    """Sort by where each span begins, then sweep once."""
    return sweep_only(sorted(spans, key=lambda span: span[0]))


def covered_units(spans: list[Span]) -> int:
    """Total length covered, counted from the merged spans."""
    return sum(end - start for start, end in merge_sorted(spans))


def gaps_between(spans: list[Span]) -> list[Span]:
    """The free spaces between merged spans, which fall out of the same pass."""
    merged = merge_sorted(spans)
    return [
        (merged[at][1], merged[at + 1][0])
        for at in range(len(merged) - 1)
        if merged[at + 1][0] > merged[at][1]
    ]


def covered_by_brute_force(spans: list[Span], span_limit: int) -> int:
    """Every unit, checked against every span. Far too slow, and a reference."""
    return sum(
        1
        for unit in range(span_limit)
        if any(start <= unit < end for start, end in spans)
    )
