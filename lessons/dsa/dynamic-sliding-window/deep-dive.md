## Why one pass, when the window moves both ways

The window grows and shrinks, sometimes several times at one position, so the
claim that this is a single pass deserves more than assertion.

Count the edge movements rather than the steps. The back edge moves right once
per value and never left. The front edge moves right some number of times and
never left. Both are bounded by the length of the sequence, so their combined
movement is at most twice that length regardless of how the window behaves in
between.

That is the whole argument, and it is why the pattern is usually presented with
the phrase "each element enters once and leaves once". An inner loop that
sometimes runs many times does not make the total quadratic, because the work it
does is paid for by positions the front edge will never visit again.

## Where the monotonicity is actually used

The front edge comes up when the condition breaks, and it stops as soon as the
condition holds. Both halves of that depend on the condition being one-way.

If adding a value could repair a broken stretch, stopping at the first position
where it holds would be wrong: a longer stretch further on might also hold, and
the window would have skipped it. If dropping a value could break a holding
stretch, the front edge could not advance safely at all.

Non-negative values give both properties for a total. This is the assumption to
state out loud when using the pattern, because code that quietly assumes it
still returns an answer on data that violates it.

## The failure a negative value causes

Take values `5, -4, 1` with a budget of 2.

The window starts by taking in 5, which is over budget on its own, so the front
edge comes up past it and the window is empty. It then takes in -4 and 1, ending
with a stretch of two.

The true answer is three. All of `5, -4, 1` totals 2, which is within budget,
and the window can never find it because it discarded position 0 the moment 5
alone broke the budget. Adding a value later brought the total back down, which
is precisely what the monotonic assumption rules out.

The window does not detect this. It returns 2 rather than 3, with nothing to
indicate anything went wrong, which is why the assumption is worth stating out
loud rather than relying on the data to hold it. The examples below test exactly
this case against an exhaustive reference.

## Fixed and dynamic, side by side

The fixed window in the earlier lesson and this one differ in exactly one place,
and the actions the figures use say so. A fixed window slides: its width never
changes, and the compiler here refuses a step that would change it. A dynamic
window advances: its width is whatever the data allows, and the compiler refuses
only a step that moves an edge backward.

Two different promises, each enforced rather than described, and choosing
between them is choosing whether the width is an input or an answer.
