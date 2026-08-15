import unittest

from last_in_order import deepest_nesting, drain, is_balanced

WORK = ["render page", "lay out list", "measure row"]


class LastInOrderTest(unittest.TestCase):
    def test_what_comes_out_is_what_went_in_reversed(self) -> None:
        # The defining property, over many inputs rather than one. A structure
        # that failed this would not be a stack whatever its methods were named.
        for items in [
            [],
            ["only"],
            WORK,
            list("abcdef"),
            ["same", "same", "same"],
        ]:
            self.assertEqual(drain(items), list(reversed(items)))

    def test_the_lesson_order(self) -> None:
        self.assertEqual(drain(WORK), ["measure row", "lay out list", "render page"])

    def test_draining_twice_restores_the_original_order(self) -> None:
        self.assertEqual(drain(drain(WORK)), WORK)

    def test_balanced_nesting_is_accepted(self) -> None:
        for text in ["", "()", "([{}])", "a(b)c[d]e", "(())()"]:
            self.assertTrue(is_balanced(text), text)

    def test_a_closer_with_nothing_open_is_rejected(self) -> None:
        self.assertFalse(is_balanced(")"))
        self.assertFalse(is_balanced("())"))

    def test_something_left_open_is_rejected(self) -> None:
        self.assertFalse(is_balanced("("))
        self.assertFalse(is_balanced("([)"))

    def test_the_wrong_closer_is_rejected(self) -> None:
        # The case a counter of opens and closes cannot detect: the counts match
        # and the nesting is still wrong.
        self.assertFalse(is_balanced("([)]"))
        self.assertEqual(sum(1 for c in "([)]" if c in "(["), 2)
        self.assertEqual(sum(1 for c in "([)]" if c in ")]"), 2)

    def test_depth_grows_with_nesting_not_with_length(self) -> None:
        # A thousand pairs in sequence never need more than one slot; ten nested
        # need ten. This is why recursion depth is the thing to reason about.
        self.assertEqual(deepest_nesting("()" * 1000), 1)
        self.assertEqual(deepest_nesting("(" * 10 + ")" * 10), 10)

    def test_text_without_brackets_is_balanced_and_flat(self) -> None:
        self.assertTrue(is_balanced("no brackets here"))
        self.assertEqual(deepest_nesting("no brackets here"), 0)


if __name__ == "__main__":
    unittest.main()
