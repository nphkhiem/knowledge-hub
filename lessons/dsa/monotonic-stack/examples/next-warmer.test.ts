import { expect, test } from "vitest";

import { byComparingPairs, byOrderedPile } from "./next-warmer.js";

const HIGHS = [30, 28, 33, 31, 35];

test("the lesson's readings", () => {
  expect(byOrderedPile(HIGHS).waits).toEqual([2, 1, 2, 1, undefined]);
});

test("both approaches agree", () => {
  const disagreed: string[] = [];

  for (const highs of [
    [],
    [5],
    HIGHS,
    [1, 2, 3, 4],
    [4, 3, 2, 1],
    [7, 7, 7],
    [2, 1, 2, 1, 2],
    [10, 1, 9, 2, 8, 3],
  ]) {
    const pile = JSON.stringify(byOrderedPile(highs).waits);
    const pairs = JSON.stringify(byComparingPairs(highs).waits);
    if (pile !== pairs) disagreed.push(JSON.stringify(highs));
  }

  expect(disagreed).toEqual([]);
});

test("every day is pushed once and popped at most once", () => {
  // The claim the lesson makes. One reading can pop many, so the bound is over
  // the whole pass rather than any single step.
  const over: number[] = [];

  for (const length of [1, 5, 20, 60]) {
    const falling = Array.from({ length }, (_, at) => length - at);
    const rising = Array.from({ length }, (_, at) => at);
    for (const highs of [falling, rising]) {
      if (byOrderedPile(highs).comparisons > 2 * highs.length)
        over.push(length);
    }
  }

  expect(over).toEqual([]);
});

test("comparing pairs costs far more on a falling sequence", () => {
  // The worst case for pairs: no day is ever answered, so every day looks at
  // every later day.
  const falling = Array.from({ length: 40 }, (_, at) => 40 - at);

  expect({
    pairsIsQuadratic:
      byComparingPairs(falling).comparisons > 10 * falling.length,
    pileIsLinear: byOrderedPile(falling).comparisons <= 2 * falling.length,
  }).toEqual({ pairsIsQuadratic: true, pileIsLinear: true });
});

test("a falling sequence answers nobody", () => {
  expect(byOrderedPile([5, 4, 3]).waits).toEqual([
    undefined,
    undefined,
    undefined,
  ]);
});

test("equal days do not answer each other", () => {
  // Warmer means strictly warmer. Equal temperatures leave both waiting.
  expect(byOrderedPile([7, 7, 8]).waits).toEqual([2, 1, undefined]);
});

test("the last day never has an answer", () => {
  // A result rather than an error, and distinct from a distance of zero.
  const answered = [HIGHS, [1, 2, 3], [3, 2, 1], [9]].filter(
    (highs) => byOrderedPile(highs).waits.at(-1) !== undefined,
  );

  expect(answered).toEqual([]);
});

test("an empty history", () => {
  expect(byOrderedPile([])).toEqual({ comparisons: 0, waits: [] });
});
