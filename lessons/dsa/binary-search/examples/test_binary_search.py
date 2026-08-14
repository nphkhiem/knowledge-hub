import unittest
from math import log2

from binary_search import Search, by_halving, by_scan

VALUES = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]


class BinarySearchTest(unittest.TestCase):
    def test_finds_a_position_holding_every_value_present(self) -> None:
        # Deliberately not "the same index as a scan": with duplicates the two
        # can differ and both be right. What must hold is that the answer is
        # an answer.
        for value in VALUES:
            found = by_halving(VALUES, value).index
            self.assertIsNotNone(found)
            self.assertEqual(VALUES[found], value)

    def test_agrees_with_a_scan_about_what_is_absent(self) -> None:
        for absent in [-4, 0, 1, 3, 24, 90, 92, 1000]:
            self.assertIsNone(by_halving(VALUES, absent).index)
            self.assertIsNone(by_scan(VALUES, absent).index)

    def test_the_lesson_search(self) -> None:
        self.assertEqual(by_halving(VALUES, 23), Search(index=5, probes=3))

    def test_never_examines_more_than_the_halvings_allow(self) -> None:
        # The claim the lesson makes, as a bound rather than an anecdote: the
        # number of looks cannot exceed the number of halvings that reach one.
        bound = int(log2(len(VALUES))) + 1
        for target in [*VALUES, -1, 7, 100]:
            self.assertLessEqual(by_halving(VALUES, target).probes, bound)

    def test_a_scan_examines_far_more_at_the_far_end(self) -> None:
        last = VALUES[-1]
        self.assertGreater(
            by_scan(VALUES, last).probes, by_halving(VALUES, last).probes
        )

    def test_doubling_the_input_adds_one_look(self) -> None:
        # Ten values need at most four looks, twenty need at most five.
        small = list(range(0, 1024))
        large = list(range(0, 2048))
        self.assertEqual(
            max(by_halving(large, value).probes for value in [0, 1023, 2047])
            - max(by_halving(small, value).probes for value in [0, 511, 1023]),
            1,
        )

    def test_finds_both_ends(self) -> None:
        self.assertEqual(by_halving(VALUES, VALUES[0]).index, 0)
        self.assertEqual(by_halving(VALUES, VALUES[-1]).index, len(VALUES) - 1)

    def test_an_empty_sequence_holds_nothing(self) -> None:
        self.assertEqual(by_halving([], 3), Search(index=None, probes=0))

    def test_a_single_value_sequence(self) -> None:
        self.assertEqual(by_halving([7], 7).index, 0)
        self.assertIsNone(by_halving([7], 8).index)

    def test_duplicates_return_a_position_holding_the_target(self) -> None:
        repeated = [1, 4, 4, 4, 9]
        found = by_halving(repeated, 4).index
        self.assertIsNotNone(found)
        self.assertEqual(repeated[found], 4)

    def test_negative_values_are_ordered_too(self) -> None:
        signed = [-9, -4, -1, 0, 6]
        for value in signed:
            self.assertEqual(signed[by_halving(signed, value).index], value)


if __name__ == "__main__":
    unittest.main()
