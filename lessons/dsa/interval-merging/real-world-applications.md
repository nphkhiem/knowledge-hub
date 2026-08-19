## Showing when a room is actually free

### Situation

A booking system displays a room's availability for a day. Bookings can overlap,
because they arrive from several calendars, and the display should show blocks of
busy time rather than a list of individual reservations.

### Why it fits

The question treats overlapping bookings as one busy period, which is exactly
what merging produces. The free gaps fall out of the same pass: they are the
spaces between the merged blocks.

### Application

Sort the bookings by start time, sweep once combining anything that overlaps or
touches, and render the result. The gaps between merged blocks are the bookable
slots, computed without a second pass.

### Constraint

Whether a booking ending at ten and one starting at ten count as touching is a
product decision. Merging them shows one continuous busy block, which is right
for a room that cannot be turned over instantly, and wrong for one where the next
meeting genuinely starts on the hour. The code must choose, and the choice
belongs in a named constant rather than an inequality buried in a loop.

## Collapsing overlapping ranges of a file transfer

### Situation

A resumable download records which byte ranges have arrived. Retries and parallel
connections mean ranges overlap and arrive out of order, and the client needs to
know what is still missing.

### Why it fits

The ranges are spans on one axis, and the question is which parts are covered.
Merging turns a growing list of overlapping fragments into the smallest set of
covered spans, and the gaps between them are precisely what still has to be
fetched.

### Application

Keep the received ranges sorted by start, merge on insertion, and derive the
missing pieces from the gaps. The stored list stays proportional to the number of
distinct covered regions rather than to the number of requests made.

### Constraint

The ranges arrive continuously, so re-sorting the whole list on every arrival
undoes the saving. Real implementations keep the merged list ordered and insert
into position, which is the same algorithm applied incrementally rather than in
one pass, and it is a different piece of code with the same precondition.
