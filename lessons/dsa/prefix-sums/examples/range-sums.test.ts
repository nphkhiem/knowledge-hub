import { expect, test } from "vitest";

import {
  buildPrefix,
  rangeTotalByPrefix,
  rangeTotalByScan,
} from "./range-sums.js";

const VALUES = [3, 1, 4, 1, 5, 9];

test("both approaches agree on every range", () => {
  const prefix = buildPrefix(VALUES);
  const disagreements: string[] = [];

  for (let start = 0; start < VALUES.length; start += 1) {
    for (let end = start; end < VALUES.length; end += 1) {
      if (
        rangeTotalByPrefix(prefix, start, end) !==
        rangeTotalByScan(VALUES, start, end)
      ) {
        disagreements.push(`${start}..${end}`);
      }
    }
  }

  expect(disagreements).toEqual([]);
});

test("the lesson's range totals ten", () => {
  expect(rangeTotalByPrefix(buildPrefix(VALUES), 2, 4)).toBe(10);
});

test("a range starting at zero needs no special case", () => {
  expect(rangeTotalByPrefix(buildPrefix(VALUES), 0, 0)).toBe(3);
});

test("the whole sequence", () => {
  expect(rangeTotalByPrefix(buildPrefix(VALUES), 0, VALUES.length - 1)).toBe(
    23,
  );
});

test("prefix is one longer than the values", () => {
  expect(buildPrefix(VALUES)).toHaveLength(VALUES.length + 1);
});

test("an empty sequence has a single zero prefix", () => {
  expect(buildPrefix([])).toEqual([0]);
});

test("negative values still subtract correctly", () => {
  expect(rangeTotalByPrefix(buildPrefix([5, -3, 2]), 0, 2)).toBe(4);
});
