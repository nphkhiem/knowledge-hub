## Undoing the most recent edit in an editor

### Situation

A text editor lets a writer undo their changes. Each edit is recorded as it
happens, and pressing undo reverses the most recent one, then the one before
that.

### Why it fits

Undo is defined in terms of recency, not of time waited. The edit a writer wants
back is always the last one made, and reversing an older edit while newer ones
still stand would produce a document that never existed.

### Application

Record each edit on a pile as it is applied. Undo takes the top one and reverses
it. Redo needs a second pile, holding what undo removed, so a redo can put it
back.

### Constraint

The pile has to be bounded or a long session consumes memory without limit, so
real editors cap the history and discard the oldest entries. That is a
deliberate exception to only touching one end, and it is why undo eventually
stops going back rather than reaching the beginning of the session.

## Reporting where an error actually happened

### Situation

A program fails deep inside a helper that many different callers use. The
message needs to say not just what failed but the chain of calls that got there.

### Why it fits

Calls nest exactly. A function cannot return before the functions it called have
returned, so the set of calls in progress is precisely a pile, and the runtime is
already maintaining it in order to know where to return to.

### Application

The runtime keeps one entry per call in progress. Raising an error reads that
pile from the top down, which produces the stack trace: the failing function
first, then its caller, then its caller's caller.

### Constraint

The trace shows what was still unfinished at that instant, which is not the same
as the history of what ran. Calls that already returned are gone from it, so a
function that corrupted some state and returned cleanly leaves no trace at all.
This is why a stack trace localizes a crash well and explains a wrong value
poorly.
