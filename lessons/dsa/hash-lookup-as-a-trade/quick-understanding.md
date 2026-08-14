## Recognition signals

The signal is repetition. One search through a list is fine. Searching the same
list again and again, for a different key each time, is the shape that a hash
answers, because the cost of preparing the structure is paid once and every
later lookup is cheap.

The second signal is the kind of question being asked. A hash answers "is this
key here, and what is stored with it". It does not answer "what comes next", or
"which keys fall between these two". If the question involves order, this is the
wrong structure.

## When it fits

A hash function turns a key into a slot number. Storing a key means computing
that number and putting the key there; finding it means computing the same
number and looking in that one slot. Nothing else is examined, which is why the
cost does not grow as the collection does.

Two different keys can produce the same slot number. That is a collision, and it
is normal rather than a failure. Both keys stay in the slot they hashed to, and
finding one means reading the few keys that slot holds. The cost of a lookup is
one hash plus a short local read.

The trade is memory for time. The table holds empty slots on purpose, because
leaving room is what keeps collisions rare, and rare collisions are what keep
that local read short.

## Limitation

A hash destroys order. It tells you where a key would be, and deliberately
scatters keys that are adjacent in any other sense, so a hash table cannot
answer what comes before or after, cannot return a range, and cannot be walked
in sorted order without sorting it again from scratch.

That is not a small caveat. It rules out a hash for anything paged, ranked, or
scanned in sequence, which is a large share of real queries. If you need both
membership and order, you need two structures or a different one entirely.
