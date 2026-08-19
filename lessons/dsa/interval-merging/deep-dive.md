## Why only the end moves

The group being built has a start that never changes and an end that grows. That
asymmetry is worth understanding rather than memorizing, because it is the whole
reason one variable is enough.

The spans arrive sorted by start. When a group opens, its start is the smallest
start remaining, so no later span can begin earlier. The start is settled
permanently at that moment.

The end has no such guarantee. A later span can end anywhere, so the group's end
is the largest end seen so far, and it has to be recomputed as each span joins.

Getting this wrong is the classic defect: taking the joining span's end rather
than the larger of the two. It is invisible whenever spans are nested-free, and
wrong whenever one span sits entirely inside another, which is exactly when a
short booking hides inside a long one.

## What sorting actually buys

Without sorting, "does this span overlap anything I have seen" is a question
about the whole set, and answering it honestly means comparing against every
previous span.

With sorting, it becomes "does this span overlap the group I am currently
building", a single comparison. The reason is that any earlier group has already
been closed by a gap, and every span still to come begins later than this one, so
nothing behind can reach forward.

That is the entire trade: one sort, and then every overlap question is local.

## The failure on unsorted input

Take the spans 10 to 12, 1 to 3, and 2 to 6, in that order. The sweep opens a
group at 10 to 12. The next span begins at 1, which is not after 12, so a naive
comparison of starts and ends can even decide they overlap and produce nonsense;
a stricter one closes the group and opens a new one at 1 to 3. Then 2 to 6
overlaps that and merges.

The output is two groups, 10 to 12 and 1 to 6. Both are real spans and the list
is shorter than the input, so nothing looks wrong. But the sweep never compared
10 to 12 against anything before it and never could.

The examples below assert this rather than describing it: the sweep on shuffled
input disagrees with the sweep on sorted input, and the sorted answer is the one
that matches an exhaustive check.

## Touching, and why it is a decision

Two spans that meet at an endpoint, one ending at 8 and the next starting at 8,
either merge or do not depending on whether the endpoint belongs to the span.

For a room booking they usually should, because there is no free minute between
them. For integer ranges representing distinct identifiers they usually should
not, because 8 belongs to one range only. Neither is more correct.

What matters is that the code says which it means. The examples here merge on
touching and name the comparison, so that changing the convention is a one-line
edit with an obvious meaning rather than a hunt for an off-by-one.
