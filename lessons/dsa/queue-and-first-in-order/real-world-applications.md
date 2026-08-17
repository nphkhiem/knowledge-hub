## Handing work from a web request to a background worker

### Situation

A web application accepts uploads that need slow processing. Rather than make
the user wait, the request records a job and returns immediately, and separate
workers process jobs as they become free.

### Why it fits

Arrivals and service are genuinely independent here: uploads come when users
choose, and workers finish when the work allows. Serving in arrival order means
a user who submitted first is not overtaken by one who submitted later, which is
the behavior a user expects even when they cannot see the line.

### Application

The web process appends the job to the back of a queue and returns. Workers take
from the front. Adding workers changes how fast the line drains without changing
the order it drains in.

### Constraint

Order is preserved only while one worker takes from the front. Several workers
pulling concurrently start jobs in order but finish in whatever order the work
takes, so anything depending on completion order needs to say so separately. A
queue orders starts, not finishes, and that distinction causes real defects.

## Visiting a graph one distance at a time

### Situation

A shortest path through a network of connections, where every step costs the
same: fewest introductions between two people, fewest moves in a puzzle.

### Why it fits

This one is not about fairness at all, which is why it is worth including.
Serving in arrival order means everything one step away is visited before
anything two steps away, because the one-step neighbors were all discovered
first. The order the queue enforces is exactly the order of increasing distance.

### Application

Start with the origin in the queue. Take from the front, record its unvisited
neighbors at the back, and repeat. The first time a destination is taken from the
front, the number of steps taken to reach it is the smallest possible.

### Constraint

The guarantee holds only while every step costs the same. Give the connections
different weights and the first arrival at a node is no longer the cheapest, and
a plain queue silently returns a wrong answer rather than failing. That is what
the weighted shortest path lesson exists for, and it replaces the queue with a
structure that serves by cost instead of by arrival.
