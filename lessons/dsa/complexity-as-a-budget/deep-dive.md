## Counting steps rather than seconds

Seconds depend on the machine, the language, and what else is running. Steps do
not. Counting the operations an algorithm performs as a function of its input
gives a number that transfers between machines, which is why analysis is written
in steps.

The count is deliberately imprecise. Whether a loop body costs one step or five
does not change how the total grows, so the constant is dropped and what remains
describes the shape of the growth alone.

## Where the pair count comes from

Comparing every item with every other item, without comparing an item with
itself and without comparing the same pair twice, gives n(n-1)/2 comparisons.
For four items that is six. For eight it is twenty-eight. For a thousand it is
499,500.

The expression expands to (n squared minus n) over two. As n grows the n squared
term dominates everything else, so the approach is described as quadratic and
the rest is discarded as noise.

## Worst case, and why it is the default

The examples below count steps for a full scan. A real duplicate check can stop
early when it finds a match, so its best case is much cheaper. Analysis usually
quotes the worst case because it is the only bound that holds regardless of the
input, and because the inputs that trigger it are rarely rare in practice.

Average-case analysis is more informative when the input distribution is known,
which for user-supplied data it usually is not.
