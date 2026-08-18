## Why the fast one must catch the slow one

The midpoint use is easy to believe: the gap grows by one each round, so half a
sequence and a whole sequence take the same number of rounds. The loop use
deserves a real argument.

Suppose the chain leads into a loop. Both positions eventually enter it, and
after that both are going round the same circle. Each round, the fast one gains
exactly one step on the slow one, so the distance between them, measured around
the loop, shrinks by exactly one each round. A quantity that decreases by one
every round and cannot go below zero must reach zero, so they land on the same
node.

That last sentence is the whole proof, and it depends on the gap closing by
exactly one. A fast position moving three steps would close the gap by two per
round, which can step over the slow one without landing on it, and the guarantee
is gone unless the loop's length happens to cooperate.

## The meeting point is not the loop's entrance

Once they meet, it is tempting to say the meeting point is where the loop begins.
It is not, and the difference is easy to miss because on the smallest examples
they coincide.

Finding the entrance is a second phase: put one position back at the start,
leave the other where they met, and advance both one step at a time. They meet
again at the entrance. That works because of a length identity between the
approach and the loop, and the examples below test it against a chain whose
entrance is known, rather than asserting it.

## What the technique cannot buy

Two positions moving blindly cannot search. They look at positions rather than
at values, and neither one ever asks whether what it is standing on is the thing
being looked for. Every question this answers is about the sequence's shape.

The constant space is the real prize. A visited set answers the loop question
just as well and costs memory proportional to the chain, which on a long chain
in a constrained environment is the difference between working and not. That
trade, not the speed, is why the technique is remembered.

## Odd, even, and a decision that has to be made

With an odd number of elements the middle is unambiguous. With an even number
there are two, and the technique lands on one of them depending on where the
fast position starts and when the loop stops.

That is a convention, not a discovery. Starting both at the front and stopping
when fast can no longer take two steps gives the later of the two candidates,
which is what the examples do and what their tests pin. Starting the fast one a
step ahead gives the earlier one. Neither is more correct, and code that does
not state which it uses will disagree with its caller on exactly half of all
inputs.
