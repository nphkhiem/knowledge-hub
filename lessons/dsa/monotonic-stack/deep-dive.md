## Why one reading popping many is still cheap

The step where one reading clears the whole pile looks like the expensive case,
and counting per reading suggests the pass could be quadratic after all.

The unit is wrong. Count per value instead. Every value is pushed exactly once,
when it is read, and popped at most once, because a popped value never returns.
So across the entire pass there are at most as many pops as there are values,
however they are distributed between readings.

A reading that pops four entries has been paid for by four earlier readings that
pushed and popped nothing. That is the whole argument, and it is the standard
example of why an inner loop that sometimes runs many times does not make an
algorithm quadratic.

## What the ordering actually buys

The pile is kept in one order so that the entries a new value answers are
contiguous and on top.

If the new value does not answer the top, it answers nothing below it either,
because everything below is further from it in the same direction. That single
implication turns "which waiting entries does this answer" from a search into a
look at one entry, and it is the only reason the pops can stop early.

Break the ordering and the structure still runs. It simply stops being able to
conclude anything from the top, and the answers it produces are wrong in a way
that no assertion inside the loop would catch.

## Values or positions

The figure holds temperatures because they are what a reader recognizes. Real
implementations almost always hold positions instead.

The reason is that the answer is usually a distance rather than a value: how
many days until it was warmer, not what the warmer temperature was. A position
can produce both, since the value is one lookup away, and a value cannot produce
the position at all. Holding values is the version that reads more clearly and
the version that has to be rewritten the moment the question changes.

## The leftovers are the answer, not an error

When the sequence ends, whatever remains on the pile never found an answer. For
a next-warmer question over a rising sequence that is the final reading; for a
falling one it is every reading.

This is a result rather than a failure, and it needs a representation distinct
from a real answer. Zero is the usual choice and the usual mistake, because zero
is also a legitimate distance in some formulations. The examples below return an
absent value rather than a sentinel, and a test pins that the last reading of a
rising sequence has no answer rather than an answer of nothing.
