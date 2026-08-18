## Detecting a loop in a chain of references

### Situation

A data structure links each record to a successor: a chain of redirects, a
parent pointer walked upward, a linked list built from user input. A cycle in it
turns a routine walk into a hang.

### Why it fits

The question is about shape and nothing else, and the structure can only be
walked forward. Recording every visited node would answer it, but that costs
memory proportional to the chain, which is exactly what a constrained
environment does not have.

### Application

Walk two positions, one following one link per round and the other two. If they
ever land on the same node there is a loop; if the fast one reaches an end there
is not. The memory used is two references regardless of the chain's length.

### Constraint

It reports that a cycle exists, not which node it starts at, and the meeting
point is generally not the loop's entrance. Finding the entrance takes a second
phase, resetting one position to the start and advancing both at the same speed
until they meet again. Code that treats the meeting point as the entrance is
wrong in a way that ordinary tests on short chains will not reveal.

## Splitting a stream into halves without buffering it twice

### Situation

A single-pass reader needs the midpoint of a sequence it can only read forward,
in order to split it, and the sequence does not report its length in advance.

### Why it fits

Reading once to count and again to reach the middle means two passes, and a
stream may not allow the second one at all. Two positions advancing together
find the midpoint by the time the sequence ends.

### Application

Advance one reader every element and another every second element. When the fast
reader ends, the slow one is at the midpoint, and the split point is known after
exactly one traversal.

### Constraint

The slow position lands on a different element for odd and even lengths, and
which one counts as "the middle" is a decision rather than a fact. Whether the
first half includes it changes the result for every even-length input, so the
convention has to be chosen and written down. The examples here return the
later of the two candidates for even lengths and say so in a test.
