## Recognition signals

The signal is a later step that would be cheap on sorted values and expensive on
unsorted ones. Searching, finding duplicates, finding the closest pair, grouping
equal things together, merging two collections. Each of those is hard work on
values in arbitrary order and nearly free once they are ordered.

The second signal is repetition. Ordering is paid once and reused by every
question afterwards, so the trade turns on how many questions there are. One
question does not repay it.

The third is adjacency. Sorting does not just arrange values, it puts related
ones next to each other, which is why duplicates become neighbors and the
closest pair becomes a neighbor comparison. A surprising number of problems are
easy once the answer is guaranteed to be adjacent.

## When it fits

Treat the ordering as a precondition rather than a step. Establish it once,
before the questions start, and then let every later step assume it.

That framing is what makes the cost analysis honest. Sorting is not part of the
search; it is an investment made before the search, and it is repaid by the
searches that follow. The right question is never "is sorting fast" but "how
many times will the order be used".

The saving comes from what order lets you skip. On unsorted values nothing rules
anything out, so every value has to be examined. On sorted values one comparison
in the middle rules out half of what is left, which is the previous lesson, and
that is only possible because the order is already there.

Ordering also makes several distinct questions collapse into one shape. Once
sorted, duplicates are adjacent, the closest pair is adjacent, and a range of
values is a contiguous run. Three different questions, one pass each.

## Limitation

Sorting costs more than a single scan. Answering one question directly is faster
than ordering everything and then answering it, so this is a poor trade for a
collection that is questioned once and discarded.

The subtler cost is that ordering destroys the order the values arrived in.
Unless that arrival order is recorded first, it cannot be recovered, and code
that needs it back has to have carried it deliberately. Sorting records by one
field silently discards whatever ordering they previously had by another, which
is what stability is about and why the next section takes it seriously.

The last limitation is that data which changes invalidates the investment. Every
insertion has to maintain the order or destroy it, and if the collection changes
as often as it is queried, the cost is being paid repeatedly rather than once.
That is the case a tree structure exists for.
