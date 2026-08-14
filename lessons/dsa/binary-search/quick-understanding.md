## Recognition signals

The signal is a collection that is already in order and a question about where
one value sits in it. Order is information, and a scan throws it away: checking
position 0, then 1, then 2 learns nothing from the fact that everything after a
value too large is also too large.

Watch for a loop walking a sorted collection from one end, comparing as it goes.
That loop is paying to rediscover an ordering that already exists.

The second signal is a ratio. Searching earns the setup when a collection is
read far more often than it is written, because the order has to be there before
the first search and maintained after every change.

## When it fits

Keep a range of positions that could still hold the answer. It starts as the
whole collection. Look at the value in the middle of that range and compare it
with the one being sought.

Three outcomes, and each is decisive. Equal means the search is over. Too small
means the answer cannot be at that position or anywhere left of it, so the range
starts just after it. Too large means the answer cannot be there or anywhere
right of it, so the range ends just before it.

Every step throws away half of what is left, so the number of steps is the
number of halvings it takes to reach a single position. That grows by one each
time the collection doubles: a thousand values take about ten looks, a million
take about twenty.

The same shape answers more than "is this present". Asking for the first
position not below a value, or the last position not above one, is the same
halving with a different rule for which half survives, and that is how sorted
data supports range queries.

## Limitation

The order has to be there already. Sorting a collection so that one search can
be fast is slower than simply scanning it once, so this pays off across many
searches, not one.

The range also has to be enterable in the middle. A structure that can only be
walked from one end cannot jump to the midpoint, and walking to it costs exactly
what the search was trying to avoid. This is why a sorted linked list gains
nothing here, and why the tree structures in later lessons exist: they keep the
halving while allowing change.
