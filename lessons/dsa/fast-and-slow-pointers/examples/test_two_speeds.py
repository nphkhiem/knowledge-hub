import unittest

from two_speeds import (
    END,
    cycle_entrance,
    has_cycle,
    middle_by_counting,
    middle_by_two_speeds,
    steps_taken,
)

READINGS = [4, 8, 15, 16, 23, 42, 9]


def chain(length: int) -> list[int]:
    """A straight chain of `length` nodes, ending rather than looping."""
    return [at + 1 for at in range(length - 1)] + [END]


def looped(length: int, entrance: int) -> list[int]:
    """A chain whose last node points back to `entrance`."""
    return [at + 1 for at in range(length - 1)] + [entrance]


class TwoSpeedsTest(unittest.TestCase):
    def test_the_lesson_readings(self) -> None:
        self.assertEqual(middle_by_two_speeds(READINGS), 3)
        self.assertEqual(READINGS[3], 16)

    def test_both_ways_of_finding_the_middle_agree(self) -> None:
        # The property, over every length rather than the lesson's one.
        for length in range(1, 60):
            values = list(range(length))
            self.assertEqual(
                middle_by_two_speeds(values),
                middle_by_counting(values),
                f"length {length}",
            )

    def test_it_is_one_pass(self) -> None:
        # The fast position takes two steps per round and stops at the end, so
        # the rounds cannot exceed half the length. Nothing walks twice.
        for length in range(1, 60):
            values = list(range(length))
            self.assertLessEqual(steps_taken(values), (length + 1) // 2)

    def test_an_even_length_returns_the_later_middle(self) -> None:
        # A convention rather than a discovery, pinned so a caller can rely on
        # it. Four values have two candidate middles, 1 and 2, and this is 2.
        self.assertEqual(middle_by_two_speeds([0, 1, 2, 3]), 2)

    def test_an_empty_sequence_has_no_middle(self) -> None:
        self.assertIsNone(middle_by_two_speeds([]))
        self.assertIsNone(middle_by_counting([]))

    def test_a_single_value_is_its_own_middle(self) -> None:
        self.assertEqual(middle_by_two_speeds([9]), 0)

    def test_a_straight_chain_has_no_cycle(self) -> None:
        for length in range(1, 30):
            self.assertFalse(has_cycle(chain(length)), f"length {length}")

    def test_a_looping_chain_has_one(self) -> None:
        for length in range(2, 30):
            for entrance in range(0, length - 1):
                self.assertTrue(
                    has_cycle(looped(length, entrance)),
                    f"length {length} entering at {entrance}",
                )

    def test_the_entrance_is_found_rather_than_assumed(self) -> None:
        # The meeting point is generally not the entrance. This checks the
        # second phase against chains whose entrance is known by construction.
        for length in range(2, 30):
            for entrance in range(0, length - 1):
                self.assertEqual(
                    cycle_entrance(looped(length, entrance)),
                    entrance,
                    f"length {length} entering at {entrance}",
                )

    def test_no_entrance_without_a_cycle(self) -> None:
        self.assertIsNone(cycle_entrance(chain(10)))

    def test_a_node_pointing_at_itself_is_a_cycle(self) -> None:
        self.assertTrue(has_cycle([0]))
        self.assertEqual(cycle_entrance([0]), 0)


if __name__ == "__main__":
    unittest.main()
