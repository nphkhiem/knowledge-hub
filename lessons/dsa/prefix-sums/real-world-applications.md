## Serving daily metric totals over arbitrary date ranges

### Situation

A dashboard reports revenue for any date range a user picks. The underlying data
is one row per day, closed and never revised once the day ends, and the same
year of history is queried repeatedly by different people picking different
ranges.

### Why it fits

Every range query re-sums days that other queries already summed. The days do
not change, which is the condition the precomputation needs, and the number of
distinct ranges a dashboard can ask for is far larger than the number of days.

### Application

Store a running total alongside each day. A range becomes the running total on
the last day minus the running total on the day before the first. The query
reads two rows regardless of whether the user asked for a week or three years.

### Constraint

A late correction to a historical day invalidates every running total after it.
Real systems handle this by recomputing the tail in a scheduled job and
accepting that corrections are visible only after it runs, which makes the
freshness of a correction an explicit product decision rather than an accident.

## Counting matches inside a window of a large log

### Situation

An analysis tool answers how many requests in a given time window returned an
error, over a fixed log of tens of millions of entries, for many different
windows.

### Why it fits

The property is per entry and does not change, and the question is a count over
a contiguous range. Writing one for an error and zero otherwise turns counting
into summing, which is exactly the operation that subtracts cleanly.

### Application

Precompute the running count of errors. Any window's error count is the running
count at its end minus the running count before its start, so an analyst
exploring dozens of windows pays one pass total rather than one scan each.

### Constraint

The precomputed array is the same length as the log and must be held somewhere,
so this trades memory for time exactly as a hash does. At tens of millions of
entries that is a real allocation, and it is worth it only because the number of
questions asked is large. For a single question, scanning once is cheaper than
building anything.
