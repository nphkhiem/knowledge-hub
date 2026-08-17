## One difference, and everything follows from it

A pile and a line hold the same items and differ in which end is served. That is
the whole distinction, and it is worth being precise about how much follows from
it.

Give both the same arrivals and the same moments of service, and they hand back
different sequences. The examples below run exactly that comparison: identical
events, two disciplines, and the assertion that the results differ in the
specific way the two lessons claim.

The consequence that matters is not the sequence but what it guarantees. In a
line every item's position only moves forward, so every item is eventually
served. In a pile an item can be buried indefinitely.

## Starvation is a property, not a risk

That last sentence is usually softened into "a stack might delay old work", which
undersells it. Under a steady stream of arrivals, a pile does not delay the
oldest item; it never serves it at all.

The examples test this rather than assert it. One item arrives first, then
arrivals and services alternate forever after. The queue serves that first item
immediately. The stack never returns it, for any number of rounds, because there
is always something newer on top.

This is why serving the newest first is a defect for externally arriving work,
and why it is fine for nested work, where the newest item is the only one that
can make progress. Same structures, opposite situations.

## What a queue does not promise

Fairness is not throughput. A queue guarantees that waiting items are served in
order; it guarantees nothing about how long that wait is. If arrivals outpace
service, the backlog grows without bound and so does every item's wait, in
perfect order the whole way down.

The usual reaction is a bigger buffer, which converts a fast failure into a slow
one and adds latency for every item that passes through. The real choices are to
serve faster, admit less, or drop work on purpose, and making that choice
explicitly is what backpressure means.

## Implementing one without accidentally making it slow

Removing the front of an array is the obvious implementation and the wrong one:
every remaining item shifts down, so each removal costs the length of the line
rather than a constant.

The fixes are a linked list, or a ring buffer holding two indices into a fixed
array so both ends move without anything shifting. Most standard libraries
provide one already, which is why this is worth recognizing rather than writing.
The examples here use the direct form for clarity and say so, because they are
demonstrating an order rather than a production structure.
