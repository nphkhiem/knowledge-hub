## Choosing a duplicate check before a bulk import

### Situation

An import endpoint accepts a batch of records and must reject the batch if it
contains the same external identifier twice. The first implementation compares
every record with every other record, which passes review because the test
fixture holds twelve records.

### Why it fits

The comparison count grows with the square of the batch size. Twelve records
cost sixty-six comparisons, which is invisible. A customer uploading fifty
thousand records costs more than a billion, which is not.

### Application

Reading the batch once into a set of seen identifiers spends one step per
record instead of one per pair. The duplicate check becomes a membership test
against the set, and the cost tracks the batch size rather than its square.

### Constraint

The set holds every identifier in memory, so the linear approach trades time for
space. For a batch large enough that the identifiers do not fit, the answer is
neither approach but a streaming check against sorted input or a database
constraint that enforces uniqueness where the data already lives.

## Estimating whether a nightly job will still finish next year

### Situation

A nightly reconciliation job compares yesterday's transactions with open
invoices. It completes in four minutes today. The finance team asks whether it
will still complete overnight after the company doubles its transaction volume.

### Why it fits

The answer depends entirely on how the cost grows, not on the four minutes. If
the job scans transactions once per invoice, doubling both sides quadruples the
work: four minutes becomes sixteen. If it indexes invoices first and looks each
one up, doubling roughly doubles it: four minutes becomes eight.

### Application

Reading the shape of the loops answers the question without a load test. A
nested scan over two growing collections is the signal that the job has a
quadratic budget and will fall over at a predictable multiple of today's volume.

### Constraint

Growth analysis assumes the work per step stays constant, and at scale it often
does not. Once the invoice index no longer fits in memory, each lookup starts
touching disk and the per-step cost rises on its own. The growth rate stays
linear while the wall-clock time gets worse, so the estimate is a floor rather
than a promise.
