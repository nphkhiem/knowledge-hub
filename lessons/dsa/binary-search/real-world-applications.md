## Finding a release that introduced a defect

### Situation

A defect is present in today's build and was absent a few hundred commits ago.
Each candidate commit can be built and tested, but doing so takes several
minutes, so checking every one is not practical.

### Why it fits

The commits are ordered by time, and the property being searched for is
monotonic: before the offending commit the defect is absent, from it onward it is
present. That is the same shape as a sorted collection, with "is the defect
here" standing in for the comparison.

### Application

Test the commit in the middle of the range. If the defect is present, the cause
is at or before it; if absent, the cause is after it. Three hundred commits are
narrowed to one in about nine builds rather than three hundred. This is exactly
what `git bisect` automates.

### Constraint

It depends entirely on the property being monotonic. A defect that appears,
gets accidentally masked, and reappears breaks the assumption, and the search
converges confidently on the wrong commit. So does a commit in the range that
does not build, which is neither a yes nor a no and has to be skipped rather
than guessed.

## Looking up a row by primary key in a database index

### Situation

A query asks for the row with a particular key from a table holding tens of
millions of rows, and the same table is queried constantly while changing
comparatively rarely.

### Why it fits

The index keeps the keys in order, which is the precondition, and the read count
vastly exceeds the write count, which is what makes maintaining that order worth
paying for.

### Application

The index is searched by descending through ordered blocks, halving the
candidate range at each level rather than scanning the table. Twenty-odd
comparisons reach one row out of millions, which is why a query on an indexed
column stays fast as a table grows and an unindexed one does not.

### Constraint

Real indexes are B-trees rather than the plain halving shown here, and the
difference is the point. Each step of this lesson's search jumps to an arbitrary
position, which on disk means a separate read. A B-tree stores many keys per
node so that one read makes many comparisons, trading the clean halving for far
fewer trips to storage. The idea survives; the literal implementation does not.
