"""Two positions moving at different speeds through a sequence.

The midpoint functions run on a list because a list is what a lesson figure can
show. The cycle functions run on a chain of successor indices, which is a linked
structure written as a list: `nexts[i]` is where `i` points, and -1 is the end.
That is where the technique actually earns its place.
"""

END = -1


def middle_by_counting(values: list[int]) -> int | None:
    """Measure, then walk to the middle. Two passes over the values."""
    if not values:
        return None
    return len(values) // 2


def middle_by_two_speeds(values: list[int]) -> int | None:
    """Advance one position per round and another two. One pass, no counting.

    With an even number of values there are two candidate middles. Starting
    both at the front and stopping when fast cannot take two more steps returns
    the later of them. That is a convention, and the tests pin it.
    """
    if not values:
        return None

    slow = 0
    fast = 0
    # The linked-list form is "while fast and fast.next", which here means the
    # fast position can still take a first step. Stopping one step earlier
    # returns the earlier of the two candidate middles instead.
    while fast + 1 < len(values):
        slow += 1
        fast += 2

    return slow


def steps_taken(values: list[int]) -> int:
    """How many rounds the two-speed walk takes, for the one-pass claim."""
    rounds = 0
    fast = 0
    while fast + 1 < len(values):
        fast += 2
        rounds += 1
    return rounds


def has_cycle(nexts: list[int], start: int = 0) -> bool:
    """Whether following successors from `start` ever revisits a node.

    Two references of memory, whatever the chain's length. A visited set would
    answer the same question and cost memory proportional to the chain.
    """
    if not nexts:
        return False

    slow = start
    fast = start
    while True:
        if fast == END or nexts[fast] == END:
            return False
        slow = nexts[slow]
        fast = nexts[nexts[fast]]
        if slow == fast:
            return True


def cycle_entrance(nexts: list[int], start: int = 0) -> int | None:
    """Where the loop begins, or None when there is no loop.

    The meeting point is not the entrance. Finding it takes a second phase:
    reset one position to the start and advance both one step at a time.
    """
    if not has_cycle(nexts, start):
        return None

    slow = start
    fast = start
    while True:
        slow = nexts[slow]
        fast = nexts[nexts[fast]]
        if slow == fast:
            break

    entrance = start
    while entrance != slow:
        entrance = nexts[entrance]
        slow = nexts[slow]

    return entrance
