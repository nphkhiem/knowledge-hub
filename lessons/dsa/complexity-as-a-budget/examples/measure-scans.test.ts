import { expect, test } from "vitest";

import { stepsForPairwiseScan, stepsForSingleScan } from "./measure-scans.js";

test("a pairwise scan spends a step per pair", () => {
  // Four distinct items make 4 * 3 / 2 = 6 pairs.
  expect(stepsForPairwiseScan([3, 8, 2, 5])).toBe(6);
});

test("pairwise cost roughly quadruples when the input doubles", () => {
  expect({
    four: stepsForPairwiseScan([1, 2, 3, 4]),
    eight: stepsForPairwiseScan([1, 2, 3, 4, 5, 6, 7, 8]),
  }).toEqual({ four: 6, eight: 28 });
});

test("a single scan spends a step per item", () => {
  expect(stepsForSingleScan([3, 8, 2, 5])).toBe(4);
});

test("single cost doubles when the input doubles", () => {
  expect({
    four: stepsForSingleScan([1, 2, 3, 4]),
    eight: stepsForSingleScan([1, 2, 3, 4, 5, 6, 7, 8]),
  }).toEqual({ four: 4, eight: 8 });
});

test("both stop early on a duplicate", () => {
  expect({
    pairwise: stepsForPairwiseScan([1, 1, 2, 3]),
    single: stepsForSingleScan([1, 1, 2, 3]),
  }).toEqual({ pairwise: 1, single: 2 });
});

test("an empty input spends nothing", () => {
  expect({
    pairwise: stepsForPairwiseScan([]),
    single: stepsForSingleScan([]),
  }).toEqual({ pairwise: 0, single: 0 });
});
