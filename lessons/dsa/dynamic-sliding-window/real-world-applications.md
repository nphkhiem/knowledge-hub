## Enforcing a rate limit over a rolling period

### Situation

A service allows a client a fixed number of requests in any sixty-second period,
counted continuously rather than reset on the minute.

### Why it fits

The set of requests inside the period is a stretch whose width is decided by the
traffic rather than chosen. As each request arrives, requests older than sixty
seconds fall out of the front, and the count is the length of what remains.

### Application

Keep the requests currently inside the period. On each arrival, drop from the
front everything older than the cutoff, then decide on the count that remains.
Each request is added once and dropped once, so the work per request is constant
on average however bursty the traffic is.

### Constraint

This window moves over time rather than over positions, so more than one entry
can fall out on a single step, and sometimes none do. The total cost is still
proportional to the number of requests, because each leaves exactly once, but
code written assuming exactly one departure per step is wrong here. That
assumption carries over easily from the fixed-width version.

## Finding the smallest healthy sample in a signal

### Situation

An analysis tool needs the shortest run of consecutive sensor readings whose
total reaches a threshold, so that the shortest reliable sample can be used
rather than an arbitrary fixed period.

### Why it fits

Shortest rather than longest, but the same shape and the same monotonicity:
taking in another reading can only raise the total toward the threshold, and
dropping one from the front can only lower it. The window grows until the
condition is met, then shrinks from the front while it still holds, recording
the smallest width seen.

### Application

Extend the back edge until the total reaches the threshold. Then bring the front
edge up while the total still reaches it, recording the width each time. Resume
extending. One pass over the readings answers it.

### Constraint

Readings must be non-negative for this to be correct, and sensor data often is
not: a drifting baseline gives negative values, and then a run that falls short
can be rescued by extending it, so shrinking from the front is no longer safe.
Checking the sign of the data is the precondition, and it is easy to skip
because the code still returns an answer.
