## Recognition signals

The signal is data made of spans: a start and an end, on one axis. Bookings on a
calendar, ranges of addresses, periods of downtime, byte ranges in a file. The
moment two of them can cover the same ground, this shape applies.

The second signal is a question that treats overlapping spans as one thing. Which
hours are busy, how much total time is covered, where are the free gaps. All
three are the same question, and all three need the overlaps resolved first.

The third is an obvious approach that compares every span with every other. That
approach is correct and grows with the square, and it is what the ordering
removes.

## When it fits

Sort the spans by where they begin, then sweep once.

That single decision is what makes the rest cheap. Once the spans are ordered by
start, any span that overlaps the group being built must be the very next one,
because everything after it begins even later. Overlap stops being a search and
becomes a comparison against one neighbor.

Keep the current group. For each next span, one of two things is true. If it
begins at or before the group ends, it overlaps, so extend the group's end to
whichever end is later. If it begins after the group ends, there is a gap, so the
group is finished and the next span opens a new one.

Only the end ever moves. The group's start was fixed the moment it opened,
because the spans arrive in order of start and none can begin earlier than the
one that opened the group.

The result is one pass over the spans after the sort, so the sort is the
expensive part and the sweep is nearly free.

## Limitation

Sorting by start is a precondition, not a tidying step. Run the sweep on
unsorted spans and it runs happily and returns a wrong answer: two spans that
overlap can sit far apart in the list, never get compared, and are reported as
separate. Nothing detects it. The output is a shorter, plausible list of spans
that happens to be untrue.

The other decision is what touching means. Whether a booking ending at 10 and one
starting at 10 should merge depends on whether the endpoint is inside the span,
and calendars and number ranges answer that differently. The code has to choose,
and it should say which it chose, because both are defensible and the difference
is invisible until it matters.
