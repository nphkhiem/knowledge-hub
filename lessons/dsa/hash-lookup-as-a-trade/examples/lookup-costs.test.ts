import { expect, test } from "vitest";

import {
  hashSlot,
  keysExaminedByHash,
  keysExaminedByScan,
} from "./lookup-costs.js";

const KEYS = ["cat", "dog", "emu", "fox", "owl", "bat", "ant", "cow"];

test("a scan examines every key before the wanted one", () => {
  expect(keysExaminedByScan(KEYS, "owl")).toBe(5);
});

test("a scan examines all keys when the wanted one is absent", () => {
  expect(keysExaminedByScan(KEYS, "yak")).toBe(KEYS.length);
});

test("hashing examines only the wanted slot", () => {
  expect(keysExaminedByHash(KEYS, "owl", 16)).toBeLessThan(3);
});

test("hashing stays cheap as the collection grows", () => {
  const larger = [
    ...KEYS,
    ...Array.from({ length: 200 }, (_, index) => `key${index}`),
  ];

  expect({
    hashed: keysExaminedByHash(larger, "owl", 512) < 3,
    scanned: keysExaminedByScan(larger, "owl") > 3,
  }).toEqual({ hashed: true, scanned: true });
});

test("a slot is stable for a key and inside the table", () => {
  expect({
    stable: hashSlot("cat", 6) === hashSlot("cat", 6),
    inside: KEYS.every((key) => hashSlot(key, 6) >= 0 && hashSlot(key, 6) < 6),
  }).toEqual({ stable: true, inside: true });
});

test("an absent key still examines only its own slot", () => {
  expect(keysExaminedByHash(KEYS, "yak", 16)).toBeLessThan(3);
});
