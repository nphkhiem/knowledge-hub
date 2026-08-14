import { expect, test } from "vitest";

import { byHalving, byScan } from "./binary-search.js";

const VALUES = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];

test("finds a position holding every value present", () => {
  // Deliberately not "the same index as a scan": with duplicates the two can
  // differ and both be right. What must hold is that the answer is an answer.
  const wrong = VALUES.filter((value) => {
    const found = byHalving(VALUES, value).index;
    return found === undefined || VALUES[found] !== value;
  });

  expect(wrong).toEqual([]);
});

test("agrees with a scan about what is absent", () => {
  const found = [-4, 0, 1, 3, 24, 90, 92, 1000].filter(
    (absent) =>
      byHalving(VALUES, absent).index !== undefined ||
      byScan(VALUES, absent).index !== undefined,
  );

  expect(found).toEqual([]);
});

test("the lesson's search", () => {
  expect(byHalving(VALUES, 23)).toEqual({ index: 5, probes: 3 });
});

test("never examines more than the halvings allow", () => {
  // The claim the lesson makes, as a bound rather than an anecdote.
  const bound = Math.floor(Math.log2(VALUES.length)) + 1;
  const over = [...VALUES, -1, 7, 100].filter(
    (target) => byHalving(VALUES, target).probes > bound,
  );

  expect(over).toEqual([]);
});

test("a scan examines far more at the far end", () => {
  const last = VALUES[VALUES.length - 1] ?? 0;

  expect(byScan(VALUES, last).probes).toBeGreaterThan(
    byHalving(VALUES, last).probes,
  );
});

test("doubling the input adds one look", () => {
  const small = Array.from({ length: 1024 }, (_, at) => at);
  const large = Array.from({ length: 2048 }, (_, at) => at);
  const worst = (values: readonly number[], targets: readonly number[]) =>
    Math.max(...targets.map((target) => byHalving(values, target).probes));

  expect(worst(large, [0, 1023, 2047]) - worst(small, [0, 511, 1023])).toBe(1);
});

test("finds both ends", () => {
  expect([
    byHalving(VALUES, VALUES[0] ?? 0).index,
    byHalving(VALUES, VALUES[VALUES.length - 1] ?? 0).index,
  ]).toEqual([0, VALUES.length - 1]);
});

test("an empty sequence holds nothing", () => {
  expect(byHalving([], 3)).toEqual({ index: undefined, probes: 0 });
});

test("a single value sequence", () => {
  expect([byHalving([7], 7).index, byHalving([7], 8).index]).toEqual([
    0,
    undefined,
  ]);
});

test("duplicates return a position holding the target", () => {
  const repeated = [1, 4, 4, 4, 9];
  const found = byHalving(repeated, 4).index;

  expect(found === undefined ? undefined : repeated[found]).toBe(4);
});

test("negative values are ordered too", () => {
  const signed = [-9, -4, -1, 0, 6];
  const wrong = signed.filter((value) => {
    const found = byHalving(signed, value).index;
    return found === undefined || signed[found] !== value;
  });

  expect(wrong).toEqual([]);
});
