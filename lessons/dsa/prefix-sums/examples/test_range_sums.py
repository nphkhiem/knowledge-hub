import unittest

from range_sums import build_prefix, range_total_by_prefix, range_total_by_scan

VALUES = [3, 1, 4, 1, 5, 9]


class RangeSumsTest(unittest.TestCase):
    def test_both_approaches_agree_on_every_range(self) -> None:
        prefix = build_prefix(VALUES)
        for start in range(len(VALUES)):
            for end in range(start, len(VALUES)):
                self.assertEqual(
                    range_total_by_prefix(prefix, start, end),
                    range_total_by_scan(VALUES, start, end),
                )

    def test_the_lesson_range_totals_ten(self) -> None:
        self.assertEqual(range_total_by_prefix(build_prefix(VALUES), 2, 4), 10)

    def test_a_range_starting_at_zero_needs_no_special_case(self) -> None:
        self.assertEqual(range_total_by_prefix(build_prefix(VALUES), 0, 0), 3)

    def test_the_whole_sequence(self) -> None:
        self.assertEqual(
            range_total_by_prefix(build_prefix(VALUES), 0, len(VALUES) - 1),
            sum(VALUES),
        )

    def test_prefix_is_one_longer_than_the_values(self) -> None:
        self.assertEqual(len(build_prefix(VALUES)), len(VALUES) + 1)

    def test_an_empty_sequence_has_a_single_zero_prefix(self) -> None:
        self.assertEqual(build_prefix([]), [0])

    def test_negative_values_still_subtract_correctly(self) -> None:
        values = [5, -3, 2]
        self.assertEqual(range_total_by_prefix(build_prefix(values), 0, 2), 4)


if __name__ == "__main__":
    unittest.main()
