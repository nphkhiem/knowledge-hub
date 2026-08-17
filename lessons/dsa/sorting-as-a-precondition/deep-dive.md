## Stability, and the ordering you did not know you had

A sort is stable when values the comparison considers equal keep the relative
order they already had. Sort people by department, and a stable sort leaves each
department's people in whatever order they were in before.

This matters because it is how two orderings are combined. Sorting by name and
then stably by department gives departments in order, each with its people
alphabetized. Do the same with an unstable sort and the second pass scrambles
the first, silently, on data that looks correct in every small test.

The trap is that unstable sorts often appear stable. Many implementations
preserve order for small inputs and stop doing so above a threshold where they
switch strategy. Code that relied on it accidentally then breaks on larger
inputs, which is the worst possible time to find out. If order among equal
values matters, either use a sort documented as stable or put the tiebreak in
the comparison itself.

## Recording what the ordering destroys

The lesson's figure keeps both rows visible so the loss is easy to see: after
ordering, nothing in the sorted row says which value arrived last.

When that matters, the fix is to record the position before sorting rather than
try to recover it after. Sorting pairs of value and original index, rather than
values alone, keeps both orderings available at the cost of carrying the index.
The examples below do exactly that, and their tests assert that the original
positions survive.

That is also the honest way to answer "where was this originally", which cannot
be answered from sorted values alone. There is no clever way back; the
information is either carried or gone.

## What the comparison count buys

Sorting by comparisons cannot beat a bound proportional to `n log n`, because
each comparison distinguishes at most two cases and there are `n!` orders to
distinguish between. That is a property of the problem rather than of any
particular algorithm, so a faster comparison sort is not waiting to be found.

Getting under it requires not comparing. Counting sort and radix sort use the
values as positions rather than asking which is larger, which is faster and
requires knowing something specific about the values, such as a bounded integer
range. That is a real trade, not a free win, and it is why the general-purpose
library sort still compares.

## When sorting is the wrong investment

Two cases, and both appear in the applications above.

Sorting a whole collection to look at a small part of it is wasted work: the top
hundred of a million does not require ordering the other nine hundred thousand.
A bounded heap answers that directly, which is a later lesson.

Sorting data that changes as often as it is queried pays the cost repeatedly
rather than once. There the ordering has to be maintained incrementally instead
of re-established, which is what a balanced tree does and what makes it worth
its extra complexity.
