import unittest

from first_in_order import (
    arrivals_in,
    serve_first_in,
    serve_last_in,
    steady_stream,
)

LESSON = ["+report.pdf", "+photo.jpg", "-", "+notes.txt", "-", "-"]


class FirstInOrderTest(unittest.TestCase):
    def test_everything_that_arrived_is_served_in_arrival_order(self) -> None:
        # The defining property, over several event sequences rather than one.
        for events in [
            ["+a", "-"],
            LESSON,
            ["+a", "+b", "+c", "-", "-", "-"],
            ["+a", "-", "+b", "-", "+c", "-"],
        ]:
            self.assertEqual(serve_first_in(events), arrivals_in(events))

    def test_the_lesson_order(self) -> None:
        self.assertEqual(
            serve_first_in(LESSON), ["report.pdf", "photo.jpg", "notes.txt"]
        )

    def test_a_pile_given_the_same_events_serves_a_different_order(self) -> None:
        # The contrast the two lessons exist to draw, on identical input.
        self.assertEqual(
            serve_last_in(LESSON), ["photo.jpg", "notes.txt", "report.pdf"]
        )

    def test_a_late_arrival_does_not_overtake_one_already_waiting(self) -> None:
        # notes.txt arrives after photo.jpg is already waiting, and is served
        # after it. This is the step where the pile does the opposite.
        served = serve_first_in(LESSON)
        self.assertLess(served.index("photo.jpg"), served.index("notes.txt"))
        piled = serve_last_in(LESSON)
        self.assertLess(piled.index("notes.txt"), piled.index("report.pdf"))

    def test_a_steady_stream_never_starves_the_first_arrival(self) -> None:
        # Not "may be delayed": under alternating arrivals and services a pile
        # never serves the first item at all, for any number of rounds.
        for rounds in [1, 5, 50]:
            events = steady_stream("first", rounds)
            self.assertIn("first", serve_first_in(events))
            self.assertNotIn("first", serve_last_in(events))

    def test_the_first_arrival_is_served_immediately_by_a_queue(self) -> None:
        self.assertEqual(serve_first_in(steady_stream("first", 5))[0], "first")

    def test_serving_an_empty_line_does_nothing(self) -> None:
        self.assertEqual(serve_first_in(["-", "-"]), [])
        self.assertEqual(serve_first_in(["-", "+a", "-"]), ["a"])

    def test_unserved_arrivals_are_simply_not_served(self) -> None:
        self.assertEqual(serve_first_in(["+a", "+b", "-"]), ["a"])

    def test_no_events_serve_nobody(self) -> None:
        self.assertEqual(serve_first_in([]), [])
        self.assertEqual(serve_last_in([]), [])

    def test_repeated_names_are_ordinary(self) -> None:
        events = ["+job", "+job", "-", "-"]
        self.assertEqual(serve_first_in(events), ["job", "job"])


if __name__ == "__main__":
    unittest.main()
