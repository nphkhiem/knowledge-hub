import unittest

from ordering_pays import by_halving, by_scan, sorted_with_origin

ARRIVED = [38, 5, 91, 23, 8]
ORDERED = [5, 8, 23, 38, 91]


class OrderingPaysTest(unittest.TestCase):
    def test_the_lesson_search(self) -> None:
        self.assertEqual(by_scan(ARRIVED, 8), (4, 5))
        self.assertEqual(by_halving(ORDERED, 8).index, 1)

    def test_halving_on_unordered_values_silently_lies(self) -> None:
        # The reason this is a precondition rather than a step. Given the same
        # values in arrival order, the halving search reports the value absent.
        # It does not fail or complain; it returns a confident wrong answer.
        self.assertIsNone(by_halving(ARRIVED, 8).index)
        self.assertEqual(by_scan(ARRIVED, 8).index, 4)

    def test_scanning_examines_every_value_in_the_worst_case(self) -> None:
        for absent in [0, 100]:
            self.assertEqual(by_scan(ARRIVED, absent).comparisons, len(ARRIVED))

    def test_ordering_makes_the_question_cheaper_the_larger_it_gets(self) -> None:
        small = list(range(0, 128))
        large = list(range(0, 1024))
        worst_small = max(by_halving(small, v).comparisons for v in small)
        worst_large = max(by_halving(large, v).comparisons for v in large)

        # Eight times the values, three more comparisons, not eight times as
        # many. That gap is what the ordering bought.
        self.assertEqual(worst_large - worst_small, 3)

        # Stated without a chosen multiplier: scanning to the far end reads
        # every value, and halving never exceeds the number of halvings that
        # reach one. At 1024 values that is 1024 against 11.
        self.assertEqual(by_scan(large, large[-1]).comparisons, len(large))
        self.assertEqual(worst_large, 11)

    def test_one_question_does_not_repay_the_ordering(self) -> None:
        # A scan reads at most every value once. Any sort must read every value
        # at least once before it can order them, so for a single question the
        # scan cannot lose.
        values = list(range(0, 512))
        self.assertLessEqual(by_scan(values, 511).comparisons, len(values))

    def test_ordering_destroys_the_arrival_order(self) -> None:
        just_values = sorted(ARRIVED)
        self.assertEqual(just_values, ORDERED)
        # Nothing in that result says 8 arrived last. The position is gone.
        self.assertNotIn(4, [ORDERED.index(v) for v in [8]])

    def test_carrying_the_position_is_the_only_way_back(self) -> None:
        placed = sorted_with_origin(ARRIVED)

        self.assertEqual([entry.value for entry in placed], ORDERED)
        self.assertEqual([entry.origin for entry in placed], [1, 4, 3, 0, 2])
        # And it really is recoverable: 8 is at sorted position 1 and arrived 5th.
        eight = next(entry for entry in placed if entry.value == 8)
        self.assertEqual((eight.origin, ARRIVED[eight.origin]), (4, 8))

    def test_equal_values_keep_their_arrival_order(self) -> None:
        # Stability, stated as a test. The two 7s must come back in the order
        # they arrived, which is what lets two sorts be combined.
        placed = sorted_with_origin([7, 3, 7, 1])
        sevens = [entry.origin for entry in placed if entry.value == 7]
        self.assertEqual(sevens, [0, 2])

    def test_an_empty_collection_orders_to_nothing(self) -> None:
        self.assertEqual(sorted_with_origin([]), [])
        self.assertEqual(by_halving([], 1), (None, 0))

    def test_a_single_value(self) -> None:
        self.assertEqual(sorted_with_origin([9]), [(9, 0)])
        self.assertEqual(by_halving([9], 9).index, 0)


if __name__ == "__main__":
    unittest.main()
