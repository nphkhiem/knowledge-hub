import { expect, test } from "vitest";
import { findPairWithSum } from "./find-pair-with-sum";

test("finds the pair the lesson animates", () => {
  expect(findPairWithSum([1, 2, 4, 7, 11, 15], 15)).toEqual([2, 4]);
});

test("reports no pair rather than guessing", () => {
  expect({
    empty: findPairWithSum([], 5),
    noPair: findPairWithSum([1, 2, 4, 7, 11, 15], 100),
    single: findPairWithSum([5], 5),
  }).toEqual({ empty: undefined, noPair: undefined, single: undefined });
});

test("handles the boundary cases that a loop condition usually gets wrong", () => {
  expect({
    adjacentPair: findPairWithSum([3, 4], 7),
    endpoints: findPairWithSum([1, 9, 9, 9, 10], 11),
    negatives: findPairWithSum([-8, -3, 0, 2, 5], -3),
    /** The same element must not be paired with itself. */
    sameValueTwice: findPairWithSum([4, 8], 8),
  }).toEqual({
    adjacentPair: [0, 1],
    endpoints: [0, 4],
    negatives: [0, 4],
    sameValueTwice: undefined,
  });
});
