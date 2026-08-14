## Recognition signals

The signal is a range question asked more than once. One total over one range is
just addition. The pattern earns its place when the same unchanging data is
asked for many different ranges, because every answer computed directly re-adds
numbers that a previous answer already added.

Watch for a loop that walks from one index to another, summing, sitting inside
another loop that chooses the indices. That shape is doing the same additions
repeatedly and is what the precomputation removes.

## When it fits

Build one extra sequence where each entry is the total of everything up to that
position. That takes a single pass. From then on, the total of any range is the
running total at the end of the range minus the running total just before it
starts.

The subtraction costs the same whether the range covers three values or three
million, because it reads two numbers. The work moved from once per question to
once in total.

The idea generalizes past addition to any operation that can be undone. Products
work if no value is zero, and counts of a property work by summing ones and
zeros. The requirement is that the combining operation has an inverse, which is
what makes the subtraction step possible.

## Limitation

The precomputed sequence is a snapshot. Change one value and every running total
from that position onward is wrong, so a single update costs a rebuild of the
tail rather than a small local fix.

That makes prefix sums a poor fit for data that changes while it is being
queried. Mixed reads and writes are what a Fenwick or segment tree exists for,
paying a little more per query to make an update cheap. Prefix sums are the
right answer only when the data holds still.
