import unittest

from lookup_costs import hash_slot, keys_examined_by_hash, keys_examined_by_scan

KEYS = ["cat", "dog", "emu", "fox", "owl", "bat", "ant", "cow"]


class LookupCostsTest(unittest.TestCase):
    def test_a_scan_examines_every_key_before_the_wanted_one(self) -> None:
        self.assertEqual(keys_examined_by_scan(KEYS, "owl"), 5)

    def test_a_scan_examines_all_keys_when_absent(self) -> None:
        self.assertEqual(keys_examined_by_scan(KEYS, "yak"), len(KEYS))

    def test_hashing_examines_only_the_wanted_slot(self) -> None:
        # Far fewer than the eight a scan would reach.
        self.assertLess(keys_examined_by_hash(KEYS, "owl", 16), 3)

    def test_hashing_stays_cheap_as_the_collection_grows(self) -> None:
        larger = KEYS + [f"key{index}" for index in range(200)]

        self.assertLess(keys_examined_by_hash(larger, "owl", 512), 3)
        self.assertGreater(keys_examined_by_scan(larger, "owl"), 3)

    def test_a_slot_is_stable_for_a_key(self) -> None:
        self.assertEqual(hash_slot("cat", 6), hash_slot("cat", 6))

    def test_a_slot_is_inside_the_table(self) -> None:
        self.assertTrue(all(0 <= hash_slot(key, 6) < 6 for key in KEYS))

    def test_an_absent_key_still_examines_only_its_own_slot(self) -> None:
        self.assertLess(keys_examined_by_hash(KEYS, "yak", 16), 3)


if __name__ == "__main__":
    unittest.main()
