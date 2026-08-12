## Recognition signals

Complexity matters when the input can grow. If a list will always hold five
items, almost any approach works and the question is not interesting. The
question becomes interesting when the list might hold five thousand, and you
need to know whether the approach you picked still finishes.

The signal to watch for is a loop inside a loop, or a scan repeated once per
item. That shape means the cost is tied to the input twice over, and the input
is the thing you do not control.

## When it fits

Think of the work an algorithm may spend as a budget the input size sets. A
single pass over n items spends about n steps: double the input and you double
the cost. Comparing every item with every other item spends about n squared over
two: double the input and the cost roughly quadruples.

That difference is invisible at four items, where one approach spends four steps
and the other spends six. At a thousand items it is the difference between a
thousand steps and half a million.

The useful habit is not memorizing growth rates. It is asking, before writing
the loop, what happens to this cost when the input is ten times bigger.

## Limitation

A growth rate deliberately throws away constant factors, and constants are real.
An approach that grows quadratically but does almost nothing per step can beat a
linear one that does expensive work per step, right up until the input is large
enough. Sorting a handful of items with insertion sort is faster than sorting
them with a more sophisticated algorithm, which is why real sorting
implementations switch strategies below a threshold.

Growth tells you which approach wins eventually. It does not tell you where
eventually starts, and for small inputs the answer can be that it never does.
