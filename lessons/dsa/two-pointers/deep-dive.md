## Why moving one pointer is safe

Suppose the values are sorted in ascending order and the current endpoints sum to more than the target. Pairing the right value with any value at or to the right of the left pointer cannot produce a smaller sum by moving left forward. The current right value is therefore too large for every remaining candidate on that side, so moving the right pointer left cannot discard a valid pair.

The symmetric argument applies when the sum is below the target: the current left value is too small for every remaining value at or to the left of the right pointer, so the left pointer can move right.

## Complexity

Each pointer moves inward at most the length of the array, giving **O(n)** scanning time and **O(1)** additional space. If the input must first be sorted, sorting usually raises the total time to **O(n log n)** and may affect whether original indices can be returned.
