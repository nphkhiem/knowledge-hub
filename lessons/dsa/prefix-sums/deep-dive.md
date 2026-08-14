## The off-by-one that this pattern is famous for

The total of the range from `start` to `end` inclusive is `prefix[end]` minus
`prefix[start - 1]`. The second term is the running total _before_ the range
begins, not at its start, and confusing the two silently includes one extra
value.

The usual defense is to build the prefix array with a leading zero, so
`prefix[0]` is 0 and `prefix[i]` is the total of the first `i` values. The range
becomes `prefix[end + 1] - prefix[start]`, with no special case when the range
begins at position zero. The examples below use the leading-zero form for
exactly that reason.

## Why an inverse is the real requirement

Subtraction is what makes the trick work, so the combining operation must be
reversible. Sums qualify. Products qualify only while no value is zero, because a
zero destroys the information needed to divide it back out.

Minimum and maximum do not qualify at all. Knowing the minimum of the first ten
values and the minimum of the first four says nothing about the minimum between
them, because the smaller value may be in the part being removed. Range minimum
questions need a different structure, usually a sparse table or a segment tree,
and this is the cleanest example of why those structures exist.

## Two dimensions

The same idea extends to a grid, where each entry holds the total of the
rectangle from the origin to that cell. A rectangle's total is then one entry
minus two, plus the one that both subtractions removed twice.

That inclusion and exclusion is the two-dimensional version of the off-by-one
above, and it is where the pattern stops being obvious by inspection.
