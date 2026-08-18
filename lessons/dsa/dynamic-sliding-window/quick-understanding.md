## Recognition signals

The signal is a question about the longest or shortest stretch satisfying some
condition, where the width is not known in advance. The longest run staying
within a budget, the shortest run reaching a total, the longest stretch with no
repeats. The width is what is being asked for, so it cannot be fixed the way the
previous window lesson fixed it.

The second signal is a one-way condition. Taking in another value can only make
a total larger, and dropping one from the front can only make it smaller.
Whenever extending can only hurt and shortening can only help, the two edges
know which way to move without searching.

Watch for a loop over every start position with an inner loop extending from it.
That shape is re-reading values that the previous start position already read,
and it is what this pattern removes.

## When it fits

Hold a stretch and move two edges, both only ever forward. Extend the back edge
to take in the next value. Whenever the condition breaks, bring the front edge up
until it holds again. Record the best stretch seen along the way.

The width is never chosen. It is whatever the data allows at each position,
which is why this reads as the window breathing rather than sliding.

The cost is the part worth holding onto. Each edge crosses the sequence exactly
once, so every value is looked at twice at most: once when it enters and once
when it leaves. The total work is proportional to the length of the sequence and
not to the width the window reaches, even though the window may grow and shrink
many times along the way.

That is why the front edge coming up is not a step backward. Both edges only
move right, so the passes never overlap and no position is revisited.

## Limitation

The condition has to be monotonic in the window's contents: adding a value must
never turn a failing stretch into a passing one. Non-negative values give that
for a total, which is why the examples use them.

Allow negative values and the guarantee is gone. A stretch that is over budget
might come back under it by taking in more, so the front edge has no reason to
come up and the whole argument collapses. The question is still answerable, but
it needs prefix sums and a different structure rather than this one adapted.

The other limit follows from the edges only moving forward: a question whose
answer requires going back to an earlier position is not this pattern, however
much it resembles it.
