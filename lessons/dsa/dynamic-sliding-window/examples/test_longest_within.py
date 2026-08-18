import unittest

from longest_within import by_every_start, by_exhaustive, by_window

READINGS = [2, 3, 1, 4, 2]
BUDGET = 6


class LongestWithinTest(unittest.TestCase):
    def test_the_lesson_readings(self) -> None:
        self.assertEqual(by_window(READINGS, BUDGET).width, 3)

    def test_both_approaches_agree_on_non_negative_values(self) -> None:
        for values in [
            [],
            [5],
            READINGS,
            [1, 1, 1, 1, 1, 1],
            [9, 9, 9],
            [0, 0, 4, 0],
        ]:
            for budget in range(0, 12):
                self.assertEqual(
                    by_window(values, budget).width,
                    by_every_start(values, budget).width,
                    f"{values} within {budget}",
                )

    def test_each_value_is_read_at_most_twice(self) -> None:
        # The property the lesson teaches. Each edge crosses the values once,
        # so the total reads cannot exceed two per value however much the
        # window grows and shrinks in between.
        for values in [READINGS, [1] * 50, [3, 3, 3, 3, 3, 3, 3, 3]]:
            self.assertLessEqual(by_window(values, 6).reads, 2 * len(values))

    def test_trying_every_start_costs_far_more(self) -> None:
        values = [1] * 40
        self.assertLessEqual(by_window(values, 6).reads, 2 * len(values))
        self.assertGreater(by_every_start(values, 6).reads, 5 * len(values))

    def test_a_budget_below_every_value_admits_nothing(self) -> None:
        self.assertEqual(by_window([4, 5, 6], 3).width, 0)

    def test_a_budget_above_the_total_admits_everything(self) -> None:
        self.assertEqual(by_window(READINGS, 100).width, len(READINGS))

    def test_an_empty_sequence_has_no_stretch(self) -> None:
        self.assertEqual(by_window([], 6), (0, 0))

    def test_zeros_extend_a_stretch_for_free(self) -> None:
        self.assertEqual(by_window([0, 0, 0], 0).width, 3)

    def test_the_window_matches_the_truth_on_non_negative_values(self) -> None:
        for values in [[], [5], READINGS, [1, 1, 1, 1], [0, 0, 4, 0], [9, 9]]:
            for budget in range(0, 12):
                self.assertEqual(
                    by_window(values, budget).width,
                    by_exhaustive(values, budget),
                    f"{values} within {budget}",
                )

    def test_a_negative_value_makes_the_window_wrong(self) -> None:
        # Not a warning left in prose. The window returns a smaller answer than
        # the truth, with nothing to indicate anything went wrong.
        values = [5, -4, 1]

        self.assertEqual(by_exhaustive(values, 2), 3)
        self.assertEqual(by_window(values, 2).width, 2)


if __name__ == "__main__":
    unittest.main()
