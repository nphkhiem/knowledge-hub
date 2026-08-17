## Recognition signals

The signal is work arriving from outside, at a time you do not control, that has
to wait its turn. Print jobs, incoming requests, messages, support tickets. The
work did not choose when it arrived, which is what makes serving it in arrival
order the defensible thing to do.

The second signal is the word "fair", or an argument about it. Whenever the
question is who should be served next and the answer is whoever has waited
longest, the shape is this one.

Watch for arrivals and departures happening independently. That independence is
what allows a backlog to exist at all, and a backlog is what makes the order of
service matter. If work were served the instant it arrived there would be no
line and no question.

## When it fits

Keep the waiting items in a line where arrivals join one end and service takes
the other. Two ends, each doing one job, and neither ever does the other's.

That is the whole rule, and it is the single difference from the previous
lesson. A pile is touched at one end only; a line is touched at both, and which
end does what is what determines the order things come back.

The consequence to hold onto is that **a new arrival joins the back however
recent it is**. It cannot delay anything already waiting, no matter how many
arrivals follow it. Every item's position only ever moves forward, so every item
is eventually served.

Both operations cost the same regardless of how long the line is, because
neither touches anything but an end. Length affects how long an item waits, not
what it costs to add or remove one.

## Limitation

Only the front is reachable. A question about the most recent arrival cannot be
answered without draining the line, and if that is the question being asked then
the previous lesson has the right structure.

The more important limit is that serving in order does not make the line keep
up. A queue guarantees fairness, not sufficiency: if arrivals outpace service the
backlog grows without bound, and every item's wait grows with it. Nothing about
the structure prevents that, and reaching for a bigger buffer treats the symptom.
The real answers are serving faster, admitting less, or deliberately shedding
work, and choosing between those is what the later lesson on backpressure is
about.
