import unittest

from find_pair_with_sum import find_pair_with_sum


class FindPairWithSumTest(unittest.TestCase):
    def test_finds_the_pair_the_lesson_animates(self) -> None:
        self.assertEqual(find_pair_with_sum([1, 2, 4, 7, 11, 15], 15), (2, 4))

    def test_reports_no_pair_rather_than_guessing(self) -> None:
        self.assertEqual(
            {
                "empty": find_pair_with_sum([], 5),
                "no_pair": find_pair_with_sum([1, 2, 4, 7, 11, 15], 100),
                "single": find_pair_with_sum([5], 5),
            },
            {"empty": None, "no_pair": None, "single": None},
        )

    def test_handles_the_boundary_cases(self) -> None:
        self.assertEqual(
            {
                "adjacent_pair": find_pair_with_sum([3, 4], 7),
                "endpoints": find_pair_with_sum([1, 9, 9, 9, 10], 11),
                "negatives": find_pair_with_sum([-8, -3, 0, 2, 5], -3),
                # The same element must not be paired with itself.
                "same_value_twice": find_pair_with_sum([4, 8], 8),
            },
            {
                "adjacent_pair": (0, 1),
                "endpoints": (0, 4),
                "negatives": (0, 4),
                "same_value_twice": None,
            },
        )


if __name__ == "__main__":
    unittest.main()
