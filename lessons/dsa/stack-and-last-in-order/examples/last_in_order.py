"""Last-in, first-out order, and one thing it is genuinely needed for.

`drain` exists to state the defining property: what comes out is what went in,
reversed. `is_balanced` exists because that property does real work there, and a
counter of opens and closes cannot do the same job.
"""

PAIRS = {")": "(", "]": "[", "}": "{"}


def drain(items: list[str]) -> list[str]:
    """Push everything, then pop everything. The order reverses."""
    pile: list[str] = []
    for item in items:
        pile.append(item)

    out: list[str] = []
    while pile:
        out.append(pile.pop())
    return out


def is_balanced(text: str) -> bool:
    """Whether every bracket closes the one most recently left open."""
    pile: list[str] = []

    for character in text:
        if character in "([{":
            pile.append(character)
        elif character in PAIRS:
            # Two distinct failures: nothing is open, or the wrong thing is.
            if not pile or pile[-1] != PAIRS[character]:
                return False
            pile.pop()

    # Anything still open never closed.
    return not pile


def deepest_nesting(text: str) -> int:
    """How deep the pile ever got, which is the space this really costs."""
    depth = 0
    deepest = 0

    for character in text:
        if character in "([{":
            depth += 1
            deepest = max(deepest, depth)
        elif character in PAIRS and depth > 0:
            depth -= 1

    return deepest
