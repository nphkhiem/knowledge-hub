## Load factor is the number that matters

The load factor is the number of stored keys divided by the number of slots. It
is the single number that predicts whether a hash table is still fast, because
the expected length of a slot's contents is proportional to it.

At a load factor of 0.75, most slots hold zero or one key and a lookup reads
almost nothing. As it approaches and passes one, slots start holding several
keys and each lookup does a longer local read. The structure degrades gradually
rather than failing, which is what makes the degradation easy to miss.

Growing the table is how the load factor is kept down, and growing means
rehashing every key into a larger table. That is an expensive operation paid
occasionally rather than per lookup, so the average stays cheap even though one
particular insert is not.

## Why collisions are expected rather than avoided

With more possible keys than slots, collisions are unavoidable. Even well below
that limit they arrive far sooner than intuition suggests: among a few dozen
keys in a few hundred slots, a shared slot is more likely than not.

So a hash table is not designed to avoid collisions. It is designed to keep them
rare enough that the local read stays short, and to handle them correctly when
they happen.

## When the guarantee stops holding

The cheap lookup is an expected cost under the assumption that keys spread
evenly. If they do not, every key can land in one slot and the structure decays
into the scan it was chosen to avoid.

That matters beyond bad luck. When keys come from outside the system, an
attacker who knows the hash function can choose keys that collide deliberately
and turn every lookup into a scan. This is why runtimes randomize their hashing
per process: not to spread keys better on average, but to stop the spread from
being predictable.
