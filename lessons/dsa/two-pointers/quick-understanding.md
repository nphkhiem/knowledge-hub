## Recognition signals

Two pointers become useful when two positions can move through the same ordered data and each comparison proves that some candidates cannot work. Common signals include a sorted sequence, a pair condition, or a region that can shrink from either side.

## When it fits

For a target pair sum in ascending data, start at both ends. If the sum is too small, move the left pointer to increase it. If the sum is too large, move the right pointer to decrease it. Each move discards a group of impossible pairs, so the scan takes linear time after sorting.

## Limitation

A pointer move needs an invariant: a fact that remains true and proves discarded candidates cannot later become valid. Without ordering or another monotonic relationship, moving one side can silently skip the answer.
