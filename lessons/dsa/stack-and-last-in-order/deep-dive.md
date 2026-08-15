## The reversal is the definition, not a side effect

Push a sequence in and pop it all out, and what comes back is the sequence
reversed. That is worth stating as a property rather than noticing as a quirk,
because it is the only observable difference between this structure and the one
in the next lesson.

The examples below test exactly that, over many inputs rather than one: whatever
goes in, draining the pile returns the reverse. A structure that failed this test
would not be a stack whatever its methods were called.

## Matching things that nest

The reversal is why a stack answers whether brackets are balanced. Every closing
bracket must match the most recently opened one that is still open, which is the
definition of the top.

Three failures are possible and they are genuinely different. A closer with an
empty pile means something closed that was never opened. A closer that does not
match the top means the wrong thing closed, which is the case that a simple
counter of opens and closes cannot detect at all. A non-empty pile at the end
means something opened and never closed.

Counting alone accepts `([)]`, which is why the pile is doing real work here
rather than saving effort.

## Depth is the cost, and it is not the amount of work

The pile holds what has started and not finished, so it grows with how deeply
work nests rather than with how much work there is. A million calls one after
another need a pile of one. A thousand calls nested inside each other need a
pile of a thousand.

That distinction is what makes recursion depth the thing to reason about rather
than the number of recursive calls. It is also why converting a recursive
procedure to a loop with an explicit pile does not reduce the space it needs; it
only moves the pile somewhere it can be grown and inspected.

## When the top is the wrong end

Everything above rests on the newest item being the one that is ready. Where that
is false, the structure is wrong rather than merely slower.

Work arriving from outside is the usual case: requests, jobs, messages. Serving
the newest first means the oldest may wait indefinitely under sustained load,
which is starvation rather than a slow queue. Recognizing which end the question
is about is what separates this lesson from the next.
