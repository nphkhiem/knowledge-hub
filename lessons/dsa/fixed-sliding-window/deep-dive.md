## Counting the windows, and the off-by-one in it

A sequence of `n` values holds `n - width + 1` windows of a given width, not
`n - width`. The first starts at position 0 and the last starts at
`n - width`, and counting the positions from 0 to `n - width` inclusive gives
one more than the difference.

The same reasoning says what to do when `width` is larger than `n`: the count
becomes zero or negative, and the honest answer is that there are no windows at
all rather than one short one. The examples below return an empty result there
instead of quietly scoring a partial window, because a partial window answers a
question nobody asked.

## Why the total is repaired rather than rebuilt

Each move removes exactly one value and adds exactly one value, whatever the
width. That is the whole claim, and it rests on the windows overlapping in all
but their ends.

Counting the work makes the difference concrete. Rebuilding each window performs
`width` additions per window, so the pass costs about `n × width`. Repairing
performs one subtraction and one addition per move, so the pass costs about
`2n` regardless of width. Every value is touched exactly twice across the whole
pass, once when it enters and once when it leaves, and that is the sentence to
keep.

Both approaches are in the examples, and their tests assert that they agree on
every width, which is the property worth pinning. An optimization that returns a
different answer is not an optimization.

The repair is not free at every width, and the examples pin that too. At width
one nothing overlaps, so the repair costs two operations to replace a rebuild
that cost one, and rebuilding is cheaper. At width two the two approaches are
exactly even. A window as wide as the whole sequence never moves, so both do the
same work. The saving only exists where there is overlap to exploit, which is
the ordinary case and not the universal one.

## Floating point does not forgive this

The repair is only exact when adding and then subtracting a value restores the
original number. With integers it does. With floating point it does not: error
accumulates across the pass, and a long window over values of very different
magnitudes can drift far enough to matter.

This is a real defect in real smoothing code, and it is why numerical libraries
either periodically recompute the window from scratch or use a compensated
summation. The array version in this lesson uses integers, which sidesteps the
issue rather than solving it.

## Where the width stops being fixed

Fixing the width in advance is what makes the repair a constant. Once the
question becomes "the longest window whose total stays under a limit", the width
depends on the data, and both ends move independently. The work is still linear,
but for a different reason, and the correctness argument has to be made again.
That is the dynamic sliding window, and it is a separate lesson.
