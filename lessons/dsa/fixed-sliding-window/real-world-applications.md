## Smoothing a noisy sensor feed on a device

### Situation

A wearable reads a heart rate sensor many times a second. Any single reading
jitters, so the number shown to the wearer is the average of the last several
seconds rather than the latest sample.

### Why it fits

The averaging period is a product decision fixed in advance, and a new average
is needed on every sample. Recomputing it means re-adding readings that were
already added moments ago, on a device where the processor waking up costs
battery.

### Application

Keep the running total of the readings currently in the period. On each new
sample, subtract the reading that has aged out and add the one that arrived,
then divide. The cost per sample does not change if the smoothing period is
widened from five seconds to sixty.

### Constraint

The readings inside the period have to be held somewhere so the departing one
can be identified, which is memory proportional to the width rather than to a
single total. On a constrained device that bounds how long the period can be,
and it is why a longer smoothing period is a memory decision rather than a free
one.

## Detecting a burst of failures in a monitoring rule

### Situation

An alerting system fires when more than a threshold of requests fail within a
fixed recent interval, say five minutes. Requests arrive continuously and the
rule is evaluated on each one.

### Why it fits

The interval is fixed by the rule, and the question is asked constantly. Walking
the whole interval on every request would make the check cost more the busier
the service gets, which is exactly when the alerting has to keep up.

### Application

Hold the count of failures currently inside the interval. As each request
arrives, add it if it failed, and drop the requests that have fallen out of the
interval, decrementing as they go. The rule reads one number.

### Constraint

This window slides over time rather than over a fixed number of positions, so
the number of entries leaving on a given step is not always one. The
per-step cost is no longer constant, only the total cost across the pass is,
because each request leaves exactly once. An implementation that assumes exactly
one departure per step is subtly wrong here, and that assumption is easy to
carry over from the array version.
