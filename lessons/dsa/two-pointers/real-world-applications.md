## Sorted client/server identifier reconciliation

### Situation

A mobile client has cached sorted record identifiers and receives a sorted identifier list from the server. It needs to determine which records were added remotely and which cached records disappeared.

### Why it fits

Both lists share the same ordering. Comparing the current identifiers proves which side cannot match any earlier value on the other side.

### Application

Keep one pointer in each list. Equal identifiers advance both pointers, a smaller client identifier marks a local removal, and a smaller server identifier marks a remote addition. Each list is traversed once.

### Constraint

Client and server must use the same identifier normalization and ordering. For very large responses, stream or page the server list without breaking global order, and handle concurrent server changes with a snapshot or version token.

## In-place compaction of a sorted event batch

### Situation

A service receives a sorted event batch and must compact adjacent duplicate keys before writing the batch to storage.

### Why it fits

Sorting places equal keys together, so a read position can discover each new key while a write position tracks the compacted region.

### Application

Advance the read pointer through every event. When its key differs from the last retained key, copy or merge that event at the write pointer and advance the write pointer. The prefix before the write pointer remains the valid compacted output.

### Constraint

In-place compaction mutates the batch and may combine event payloads. The merge policy must preserve required ordering and audit information, and immutable or shared input requires a separate output buffer.
