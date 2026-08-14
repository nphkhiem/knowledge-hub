"""Count the slots two membership checks examine on the same keys.

The lesson's claim is that hashing removes a scan. Both functions return how
many stored keys they had to look at, so the difference is observable rather
than asserted.
"""


def keys_examined_by_scan(keys: list[str], wanted: str) -> int:
    """Compare against each key in turn. Cost grows with the collection."""
    examined = 0
    for key in keys:
        examined += 1
        if key == wanted:
            return examined
    return examined


def keys_examined_by_hash(keys: list[str], wanted: str, slots: int) -> int:
    """Read only the keys that share the wanted key's slot."""
    table: dict[int, list[str]] = {}
    for key in keys:
        table.setdefault(hash_slot(key, slots), []).append(key)

    examined = 0
    for key in table.get(hash_slot(wanted, slots), []):
        examined += 1
        if key == wanted:
            return examined
    return examined


def hash_slot(key: str, slots: int) -> int:
    """A deliberately simple hash, so the slot for a key is easy to follow."""
    total = 0
    for character in key:
        total = (total * 31 + ord(character)) % slots
    return total
