## Recognition signals

The signal is a question about the shape of a sequence rather than about
anything in it. Where is the middle. Does it loop back on itself. Is there an
element a fixed fraction from the end. None of those name a value, and none of
them can be answered by looking at one position.

The second signal is that the length is unknown or costly to get. On a structure
you can only walk forward, measuring the length means walking it, so measuring
and then walking again is two passes to do one thing.

The third is the shape of the answer: a ratio. The middle is one half, the point
a third of the way in is one third. Whenever the answer is a proportion of the
whole, two positions moving at that proportion will meet it.

## When it fits

Send two positions through the sequence together, one moving a step at a time
and the other moving two. The gap between them grows by one each round, so when
the fast one has covered the whole sequence, the slow one has covered half.

Nothing is counted and nothing is remembered. The stopping condition is the fast
position running out of sequence, not a comparison against a length, which is
what makes it a single pass.

The ratio is a dial rather than a rule. One step against three finds the point a
third of the way in; the arithmetic is the same and only the speed changes.

The second use is detecting a loop, and it is the one that cannot be done any
other way in constant space. If the sequence eventually revisits somewhere it
has been, a faster position must eventually catch a slower one from behind,
because the gap between them closes by one each round once both are going round
the same loop. If there is no loop, the fast one simply reaches the end. Meeting
means a cycle; running out means none.

## Limitation

It answers questions about position and shape, never about values. Where the
middle is, yes. Where the value 16 is, no: that is a search, and two positions
moving blindly past everything cannot do it.

The honest limitation of the figure above is that its sequence is an array,
where the length is already known and the middle is arithmetic. Nothing is
gained there. The technique earns its place on a structure that can only be
walked forward, such as a linked list, where nothing knows the length until it
has been walked, and where the loop question has no cheap alternative at all.

The last limit is that the two positions must move at a fixed ratio. Speeds that
depend on the data break the gap argument, and with it both the midpoint
guarantee and the meeting guarantee.
