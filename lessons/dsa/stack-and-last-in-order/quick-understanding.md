## Recognition signals

The signal is work that starts before earlier work has finished, where each
piece is blocked by the piece started after it. Rendering waits on layout,
layout waits on measurement. Nothing in that chain can finish out of order,
because finishing means the thing you were waiting for is done.

The second signal is a need to remember something now and come back to it in
reverse later. Reading nested brackets, walking into a directory and back out,
undoing the most recent change first. In each case the thing most recently set
aside is the thing you need next.

Watch for a description containing the word "nested". Nesting is this shape.

## When it fits

Keep the unfinished items in a pile where you only ever touch one end. Starting
something puts it on top; finishing takes the top off. Both cost the same
regardless of how deep the pile is, because neither touches anything but the
end.

That single rule is the whole structure, and it is what makes the order come out
reversed. It is not a policy chosen for convenience: while each item waits on
the one above it, the top is the only item that could possibly be ready.

The order the pile produces is exactly the reverse of the order it received, and
that is worth stating as a property rather than an observation. It is what the
examples below test.

Depth is the thing to watch. The pile records everything started and not yet
finished, so it grows with how deeply the work nests, not with how much work
there is in total.

## Limitation

Only the top is reachable, which is the trade. A question about the item that
has waited longest cannot be answered without emptying the pile, and if that is
the question being asked then this is the wrong structure and the next lesson
has the right one.

The other limit is depth. Every unfinished item costs space, so work that nests
without ever resolving does not fail gracefully: it exhausts the space set aside
for the pile. That failure has a name most people meet before they meet the data
structure, which is what a stack overflow is.
