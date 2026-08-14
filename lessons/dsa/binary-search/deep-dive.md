## The bug that lived in production code for two decades

The obvious way to find the middle of a range is `(low + high) / 2`. It is
wrong in any language with fixed-width integers: when `low` and `high` are both
large, their sum overflows before the division happens, and the result is
negative or garbage.

The defect is famous because it survived in widely used library code, including
the JDK's own binary search, for around twenty years. It cannot be reached with
a small array, which is exactly why testing never found it.

The fix is to compute the offset instead of the sum: `low + (high - low) / 2`.
The difference is always smaller than the range, so nothing overflows. The
examples here use that form even in languages where the plain sum would be safe,
because the habit is the point.

## Getting the loop to terminate

Binary search is short and famously easy to get subtly wrong. Two decisions
settle it, and they have to agree with each other.

The first is what the range means. Here it is inclusive on both ends, so the
range is empty exactly when `low` exceeds `high`, and the loop continues while
`low <= high`. The alternative is a half-open range where `high` is one past the
end, the loop runs while `low < high`, and the arithmetic differs throughout.
Both are correct; mixing them is not, and most binary search bugs are a mixture.

The second is that every step must shrink the range. Moving to `mid + 1` or
`mid - 1` guarantees it, because the midpoint itself is excluded from whatever
survives. Setting `low = mid` instead looks harmless and hangs forever the
moment `mid` equals `low`, which happens on every two-element range.

## What the count of steps really says

Each step discards half of what remains, so the question is how many halvings
reduce the collection to a single position. That is the base-two logarithm, and
it is why the numbers feel implausible: a million values take about twenty
looks, and a billion take about thirty.

The practical consequence runs the other way. Doubling the data adds one step,
so a search that is fast today stays fast at a scale that would defeat a scan
entirely. That property, not the speed on any particular input, is what makes
the ordering worth maintaining.

## Duplicates, and what "found" means

With repeated values, plain binary search finds _an_ index holding the sought
value, not the first or the last one. Which one depends on where the midpoints
happen to land, and that is not a stable thing to rely on.

The tests below assert exactly this and no more: the returned position holds the
target. When the first or last occurrence is actually needed, the search does
not stop on a match. It records the position and keeps halving on the side the
answer is wanted from, which is the same procedure with a different stopping
rule.
