"""Count the steps two duplicate checks spend on the same input.

The point of the lesson is that the step count, not the wall clock, is what
grows with the input. Both functions return the number of comparisons they
performed so the growth can be observed directly.
"""


def steps_for_pairwise_scan(values: list[int]) -> int:
    """Compare every item with every later item. Cost grows with n squared."""
    steps = 0
    for left in range(len(values)):
        for right in range(left + 1, len(values)):
            steps += 1
            if values[left] == values[right]:
                return steps
    return steps


def steps_for_single_scan(values: list[int]) -> int:
    """Read each item once against a set of what was already seen."""
    steps = 0
    seen: set[int] = set()
    for value in values:
        steps += 1
        if value in seen:
            return steps
        seen.add(value)
    return steps
