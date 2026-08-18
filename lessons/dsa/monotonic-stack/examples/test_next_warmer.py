import unittest

from next_warmer import by_comparing_pairs, by_ordered_pile

HIGHS = [30, 28, 33, 31, 35]


class NextWarmerTest(unittest.TestCase):
    def test_the_lesson_readings(self) -> None:
        self.assertEqual(by_ordered_pile(HIGHS).waits, [2, 1, 2, 1, None])

    def test_both_approaches_agree(self) -> None:
        # The property, over many shapes rather than the lesson's one.
        for highs in [
            [],
            [5],
            HIGHS,
            [1, 2, 3, 4],
            [4, 3, 2, 1],
            [7, 7, 7],
            [2, 1, 2, 1, 2],
            [10, 1, 9, 2, 8, 3],
        ]:
            self.assertEqual(
                by_ordered_pile(highs).waits,
                by_comparing_pairs(highs).waits,
                f"{highs}",
            )

    def test_every_day_is_pushed_once_and_popped_at_most_once(self) -> None:
        # The claim the lesson makes. One reading can pop many, so the bound is
        # over the whole pass rather than any single step.
        for length in [1, 5, 20, 60]:
            falling = list(range(length, 0, -1))
            rising = list(range(length))
            for highs in [falling, rising]:
                self.assertLessEqual(
                    by_ordered_pile(highs).comparisons, 2 * len(highs)
                )

    def test_comparing_pairs_costs_far_more_on_a_rising_sequence(self) -> None:
        rising = list(range(40))
        self.assertLessEqual(by_ordered_pile(rising).comparisons, 2 * len(rising))
        self.assertEqual(by_comparing_pairs(rising).comparisons, len(rising) - 1)

    def test_comparing_pairs_costs_far_more_on_a_falling_sequence(self) -> None:
        # The worst case for pairs: no day is ever answered, so every day looks
        # at every later day.
        falling = list(range(40, 0, -1))
        pairs = by_comparing_pairs(falling).comparisons
        self.assertGreater(pairs, 10 * len(falling))
        self.assertLessEqual(by_ordered_pile(falling).comparisons, 2 * len(falling))

    def test_a_falling_sequence_answers_nobody(self) -> None:
        self.assertEqual(by_ordered_pile([5, 4, 3]).waits, [None, None, None])

    def test_equal_days_do_not_answer_each_other(self) -> None:
        # Warmer means strictly warmer. Equal temperatures leave both waiting.
        self.assertEqual(by_ordered_pile([7, 7, 8]).waits, [2, 1, None])

    def test_the_last_day_never_has_an_answer(self) -> None:
        # A result rather than an error, and distinct from a distance of zero.
        for highs in [HIGHS, [1, 2, 3], [3, 2, 1], [9]]:
            self.assertIsNone(by_ordered_pile(highs).waits[-1])

    def test_an_empty_history(self) -> None:
        self.assertEqual(by_ordered_pile([]), ([], 0))


if __name__ == "__main__":
    unittest.main()
