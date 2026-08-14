## Deduplicating a stream of event identifiers

### Situation

A consumer reads events from a queue that guarantees at-least-once delivery, so
the same event can arrive twice. Each event carries an identifier, and the
consumer must process each identifier exactly once.

### Why it fits

The question is pure membership: has this identifier been seen. There is no
ordering question, no range, and no ranking, which is exactly the shape a hash
answers. Checking a list of seen identifiers would cost a scan per event, and
the list grows as the stream runs.

### Application

Keep a set of processed identifiers. Each arriving event hashes its identifier
once, reads that one slot, and either skips the event or records it. The cost
per event stays flat no matter how many events have already been processed.

### Constraint

The set grows without bound, and memory is the thing being traded. A long-lived
consumer needs an eviction policy, usually a time window past which a repeat is
accepted as vanishingly unlikely. That window is a correctness decision, not a
tuning knob: too short and a late duplicate slips through.

## Routing a request to its handler

### Situation

A web framework receives a request path and must find the function registered
for it. A service may register hundreds of routes, and every request pays this
lookup before any work begins.

### Why it fits

Exact-match routes are membership questions, and they are asked constantly with
a different key each time. Matching a path against each registered route in turn
costs a scan on every request, and that cost grows every time a team adds a
route.

### Application

Register exact routes in a hash table keyed by path. A request hashes its path
once and reaches its handler directly, so adding routes does not slow down the
requests that were already fast.

### Constraint

This only covers exact matches. Routes with parameters or wildcards are not
membership questions, because the key is not known in advance, so real routers
keep a hash table for exact paths and fall back to an ordered structure for
patterns. The hash removes most of the work; it does not remove the need for the
other structure.
