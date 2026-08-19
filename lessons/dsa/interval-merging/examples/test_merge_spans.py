import random
import unittest

from merge_spans import (
    covered_by_brute_force,
    covered_units,
    gaps_between,
    merge_sorted,
    sweep_only,
)

BOOKINGS = [(1, 3), (2, 6), (5, 8), (10, 12), (11, 13)]


class MergeSpansTest(unittest.TestCase):
    def test_the_lesson_bookings(self) -> None:
        self.assertEqual(merge_sorted(BOOKINGS), [(1, 8), (10, 13)])

    def test_a_gap_closes_a_group(self) -> None:
        self.assertEqual(gaps_between(BOOKINGS), [(8, 10)])

    def test_a_span_inside_another_does_not_shrink_it(self) -> None:
        # The classic defect: taking the joining span's end rather than the
        # larger of the two. Invisible until one span nests inside another.
        self.assertEqual(merge_sorted([(1, 9), (2, 4)]), [(1, 9)])

    def test_touching_spans_merge(self) -> None:
        # A decision rather than a fact, pinned so a caller knows which.
        self.assertEqual(merge_sorted([(1, 4), (4, 7)]), [(1, 7)])

    def test_the_sort_is_a_precondition_not_a_tidying_step(self) -> None:
        # Not a warning in prose. The unsorted sweep returns a plausible,
        # shorter list of real spans, and it is wrong.
        shuffled = [(10, 12), (1, 3), (2, 6)]
        self.assertEqual(merge_sorted(shuffled), [(1, 6), (10, 12)])
        self.assertNotEqual(sweep_only(shuffled), merge_sorted(shuffled))

    def test_merging_agrees_with_counting_every_unit(self) -> None:
        # The property, against a reference too slow to use, over random input.
        generator = random.Random(11)
        for _ in range(200):
            spans = []
            for _ in range(generator.randint(0, 6)):
                start = generator.randint(0, 18)
                spans.append((start, start + generator.randint(0, 5)))
            self.assertEqual(
                covered_units(spans),
                covered_by_brute_force(spans, 30),
                f"{spans}",
            )

    def test_merged_spans_come_out_sorted_and_disjoint(self) -> None:
        generator = random.Random(29)
        for _ in range(200):
            spans = [
                (s, s + generator.randint(0, 4))
                for s in (generator.randint(0, 18) for _ in range(5))
            ]
            merged = merge_sorted(spans)
            for at in range(len(merged) - 1):
                # Sorted, and separated by a real gap rather than touching.
                self.assertLess(merged[at][1], merged[at + 1][0], f"{spans}")

    def test_no_spans(self) -> None:
        self.assertEqual(merge_sorted([]), [])
        self.assertEqual(gaps_between([]), [])

    def test_one_span_is_already_merged(self) -> None:
        self.assertEqual(merge_sorted([(3, 9)]), [(3, 9)])

    def test_identical_spans_collapse_to_one(self) -> None:
        self.assertEqual(merge_sorted([(2, 5), (2, 5), (2, 5)]), [(2, 5)])

    def test_a_zero_length_span_is_kept(self) -> None:
        # A booking of no duration is still a real record, and dropping it
        # silently would lose data the caller supplied.
        self.assertEqual(merge_sorted([(4, 4)]), [(4, 4)])


if __name__ == "__main__":
    unittest.main()
