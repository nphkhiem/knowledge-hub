## Recognition signals

The signal is a question asked of every position that names a direction: the
next value to the right that is larger, the previous one that is smaller, how
far away the next taller building is. Each position needs an answer, and the
answer lies somewhere ahead.

The second signal is that a position cannot be answered when it is read.
Nothing after it has been seen yet, so it has to wait. The moment you notice
that several positions are all waiting for the same kind of thing, the pile is
the structure that holds them.

The third is an obvious approach that compares every pair. That approach is
correct and quadratic, and the ordering is what makes most of its comparisons
unnecessary.

## When it fits

Read the sequence once, keeping a pile of positions still waiting for an
answer. The pile is held in one order, decreasing for a next-greater question,
and that order is the whole trick.

When a new value arrives, everything on the pile that it answers is on top,
because the pile is ordered. Pop while the new value answers the top, record the
answer for each, and then push the new value to wait its turn.

Nothing below the first value that survives can be answered by this reading. If
the top is not answered, nothing under it is either, and that single implication
is what turns the search for who to answer into a look at one entry.

The cost is worth stating carefully, because one reading can pop many entries
and that looks expensive. Count per value rather than per reading: every value
is pushed exactly once and popped at most once, so the whole pass is
proportional to the number of values however uneven the individual steps look.

## Limitation

The condition that pops has to be the same condition that orders the pile. A
pile kept decreasing answers next-greater questions and nothing else; asking it
a different question gives a confident wrong answer rather than a complaint.

Whatever is still waiting when the sequence ends has no answer, and that is a
real outcome rather than an error. The last reading of a rising sequence never
gets one, because nothing follows it. Code that treats the leftover pile as a
failure to handle rather than as the result will report the wrong thing for
every input whose largest value is at the end.
