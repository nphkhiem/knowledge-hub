## Reporting how long until each price recovers

### Situation

A dashboard shows, for every day in a price history, how many days passed before
the price next exceeded that day's close. The history is long and the report is
regenerated whenever it is opened.

### Why it fits

Every day needs an answer that lies somewhere after it, and no day can be
answered when it is read. Comparing every pair of days is correct and grows with
the square of the history, which is exactly the cost the ordered pile removes.

### Application

Read the days once, keeping the unanswered ones on a pile in decreasing order.
Each day's close pops every waiting day it exceeds, recording the gap for each,
then waits itself. One pass produces the whole report.

### Constraint

Days still on the pile at the end never recovered within the window, and their
answer is not zero but absent. Rendering absent as zero is a real defect: it
draws a flat bar where the honest answer is that the data does not say, and a
reader cannot tell the two apart.

## Sizing the largest usable area in a layout

### Situation

A layout tool finds the largest rectangle that fits inside a skyline of columns
of differing heights, a shape that appears when packing images or measuring the
biggest clear block in a histogram.

### Why it fits

Each column's rectangle extends left and right until it meets something shorter,
so every column needs the nearest shorter column on each side. That is two
next-smaller questions, and one ordered pile answers each of them in one pass.

### Application

Keep an increasing pile of columns. A shorter column arriving pops the taller
ones, and each popped column now knows both its boundaries: the arriving column
on the right, and whatever sits below it on the pile on the left. Its rectangle
can be measured on the spot.

### Constraint

The left boundary comes from the pile's contents rather than from the input,
which is where implementations go wrong. It is the entry below the popped one
after the pop, not the popped one's own position, and the two coincide often
enough on small examples to hide the mistake until a real skyline is tried.
