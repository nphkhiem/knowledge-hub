## Finding duplicate records in an imported file

### Situation

An import brings in a few hundred thousand customer records and the job has to
report which ones share an email address before anything is written.

### Why it fits

Comparing every record with every other is quadratic and unusable at this size.
Sorting by email makes any two records with the same address adjacent, which
turns the question into a single pass comparing each record with the one before
it.

### Application

Sort by the field the duplicates are defined on, then walk the sorted records
once and report any neighbor that matches. One ordering pass and one comparison
pass, rather than a comparison for every pair.

### Constraint

This finds records that are exactly equal on that field. Duplicates in the real
sense, `A.Smith@x.com` against `a.smith@x.com`, or a trailing space, are not
adjacent unless the sort key is normalized first. The normalization is the part
that actually decides what counts as duplicate; the sort only groups whatever the
key says is equal.

## Serving a leaderboard that is read constantly and written rarely

### Situation

A game shows the top hundred players. Scores change occasionally, and the board
is read thousands of times for every change.

### Why it fits

The read-to-write ratio is exactly the condition for treating order as a
precondition. Ordering is paid on the rare write and reused by every read, and a
read then does no comparison work at all: the top hundred is the first hundred.

### Application

Keep the scores ordered as they are written rather than sorting on each read. A
read becomes a slice from the front, and the cost of the ordering is amortized
across every read that follows it.

### Constraint

This inverts if writes become frequent. A board where every player's score
changes continuously pays the ordering cost repeatedly and gains little, and at
that point the right structure keeps only the top hundred rather than ordering
everything. Sorting the whole collection to look at a small part of it is the
mistake this lesson makes easy to spot, and the heap lesson is the correction.
