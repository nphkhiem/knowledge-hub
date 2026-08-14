import unittest

from window_totals import best_window_total, by_rescan, by_sliding, window_count

VALUES = [5, 1, 8, 2, 3, 7]
WIDTH = 3


class WindowTotalsTest(unittest.TestCase):
    def test_both_approaches_agree_at_every_width(self) -> None:
        for width in range(1, len(VALUES) + 1):
            self.assertEqual(
                by_sliding(VALUES, width).totals,
                by_rescan(VALUES, width).totals,
                f"width {width}",
            )

    def test_the_lesson_windows(self) -> None:
        self.assertEqual(by_sliding(VALUES, WIDTH).totals, [14, 11, 13, 12])

    def test_the_largest_window_is_the_first(self) -> None:
        self.assertEqual(best_window_total(VALUES, WIDTH), 14)

    def test_every_move_after_the_first_window_costs_exactly_two(self) -> None:
        # The property the lesson teaches: a move removes one value and adds
        # one, whatever the width.
        for width in range(1, len(VALUES) + 1):
            scan = by_sliding(VALUES, width)
            moves = len(scan.totals) - 1
            self.assertEqual(scan.operations - width, 2 * moves, f"width {width}")

    def test_sliding_does_less_arithmetic_when_there_is_overlap_to_exploit(
        self,
    ) -> None:
        # Width three upward, and at least two windows, so there is a move to
        # save anything on.
        for width in range(3, len(VALUES)):
            self.assertLess(
                by_sliding(VALUES, width).operations,
                by_rescan(VALUES, width).operations,
                f"width {width}",
            )

    def test_one_window_saves_nothing(self) -> None:
        # A window as wide as the sequence never moves, so there is nothing to
        # repair and both approaches do identical work.
        width = len(VALUES)
        self.assertEqual(
            by_sliding(VALUES, width).operations,
            by_rescan(VALUES, width).operations,
        )

    def test_repairing_is_not_worth_it_at_width_one(self) -> None:
        # Honest edge: with nothing overlapping, the repair costs more than the
        # rebuild it replaces.
        self.assertGreater(
            by_sliding(VALUES, 1).operations, by_rescan(VALUES, 1).operations
        )

    def test_a_window_as_wide_as_the_sequence_has_one_position(self) -> None:
        self.assertEqual(by_sliding(VALUES, len(VALUES)).totals, [sum(VALUES)])

    def test_a_window_wider_than_the_sequence_has_none(self) -> None:
        self.assertEqual(by_sliding(VALUES, len(VALUES) + 1).totals, [])
        self.assertIsNone(best_window_total(VALUES, len(VALUES) + 1))

    def test_an_empty_sequence_has_no_windows(self) -> None:
        self.assertEqual(by_sliding([], 3).totals, [])

    def test_a_width_of_zero_or_less_has_no_windows(self) -> None:
        self.assertEqual(window_count(len(VALUES), 0), 0)
        self.assertEqual(by_sliding(VALUES, 0).totals, [])
        self.assertEqual(by_rescan(VALUES, -1).totals, [])

    def test_negative_values_repair_correctly(self) -> None:
        values = [4, -2, 6, -1]
        self.assertEqual(by_sliding(values, 2).totals, by_rescan(values, 2).totals)


if __name__ == "__main__":
    unittest.main()
