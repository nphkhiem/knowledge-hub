import unittest

from measure_scans import steps_for_pairwise_scan, steps_for_single_scan


class MeasureScansTest(unittest.TestCase):
    def test_pairwise_scan_spends_a_step_per_pair(self) -> None:
        # Four distinct items make 4 * 3 / 2 = 6 pairs.
        self.assertEqual(steps_for_pairwise_scan([3, 8, 2, 5]), 6)

    def test_pairwise_cost_roughly_quadruples_when_the_input_doubles(
        self,
    ) -> None:
        four = steps_for_pairwise_scan([1, 2, 3, 4])
        eight = steps_for_pairwise_scan([1, 2, 3, 4, 5, 6, 7, 8])

        self.assertEqual((four, eight), (6, 28))

    def test_single_scan_spends_a_step_per_item(self) -> None:
        self.assertEqual(steps_for_single_scan([3, 8, 2, 5]), 4)

    def test_single_cost_doubles_when_the_input_doubles(self) -> None:
        four = steps_for_single_scan([1, 2, 3, 4])
        eight = steps_for_single_scan([1, 2, 3, 4, 5, 6, 7, 8])

        self.assertEqual((four, eight), (4, 8))

    def test_both_stop_early_on_a_duplicate(self) -> None:
        self.assertEqual(
            (
                steps_for_pairwise_scan([1, 1, 2, 3]),
                steps_for_single_scan([1, 1, 2, 3]),
            ),
            (1, 2),
        )

    def test_an_empty_input_spends_nothing(self) -> None:
        self.assertEqual(
            (steps_for_pairwise_scan([]), steps_for_single_scan([])), (0, 0)
        )


if __name__ == "__main__":
    unittest.main()
