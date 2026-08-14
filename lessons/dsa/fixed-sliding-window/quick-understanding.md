## Recognition signals

The signal is a question asked about every group of a fixed size in a sequence.
The best total of any three consecutive days, the average of every ten
consecutive readings, whether any window of five holds a duplicate. One group is
just arithmetic. The pattern earns its place because there are as many groups as
there are positions.

Watch for a loop that walks a fixed number of steps from an index, sitting
inside a loop that chooses the index. That inner loop is re-reading values the
previous group already read, and it is what the window removes.

The clue that makes it work is overlap. Two neighboring groups of width three
share two of their three values. Only the ends differ.

## When it fits

Score the first group directly. Then move the window one step at a time, and at
each step repair the answer instead of recomputing it: remove the value that
just left, add the value that just arrived.

The repair costs the same whether the window holds three values or three
thousand, because exactly two values change however wide it is. The whole pass
touches each value twice, once as it enters and once as it leaves, so the work
is proportional to the length of the sequence rather than to the length times
the width.

The window does not have to carry a sum. Anything you can update incrementally
works: a count of how many values satisfy some property, a running product, a
tally of how many times each value appears. The requirement is that a departing
value can be taken back out.

## Limitation

The width has to be fixed and known before the pass starts. The moment the
question becomes "the best group of any size that satisfies some condition", the
window has to grow and shrink in response to the data, which is a different
pattern with a different correctness argument.

The other limit is the repair itself. Removing a value only works if the
operation has an inverse. Sums and counts qualify. A maximum does not: knowing
the largest value in the window says nothing about the largest once that value
slides out, because the runner-up was never recorded. Windowed maximum questions
need a structure that keeps the candidates, which is why a monotonic queue
exists.
