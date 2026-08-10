"""Two pointers moving inward across an ascending-sorted sequence."""

from typing import Optional, Sequence


def find_pair_with_sum(
    values: Sequence[int], target: int
) -> Optional[tuple[int, int]]:
    """Return the indices of the two values that add to ``target``.

    ``values`` must be sorted in ascending order. Returns ``None`` when no pair
    sums to the target. Runs in O(n) time and O(1) additional space.
    """
    left, right = 0, len(values) - 1

    while left < right:
        total = values[left] + values[right]
        if total == target:
            return left, right

        # The larger value cannot pair with anything still in range, so drop it.
        if total > target:
            right -= 1
        else:
            left += 1

    return None
