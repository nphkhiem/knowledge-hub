import { expect, test } from "vitest";

import { byHalving, byScan, sortedWithOrigin } from "./ordering-pays.js";

const ARRIVED = [38, 5, 91, 23, 8];
const ORDERED = [5, 8, 23, 38, 91];

test("the lesson's search", () => {
  expect({
    halving: byHalving(ORDERED, 8).index,
    scan: byScan(ARRIVED, 8),
  }).toEqual({ halving: 1, scan: { comparisons: 5, index: 4 } });
});

test("halving on unordered values silently lies", () => {
  // The reason this is a precondition rather than a step. Given the same values
  // in arrival order, the halving search reports the value absent. It does not
  // fail or complain; it returns a confident wrong answer.
  expect({
    halvingOnArrival: byHalving(ARRIVED, 8).index,
    scanOnArrival: byScan(ARRIVED, 8).index,
  }).toEqual({ halvingOnArrival: undefined, scanOnArrival: 4 });
});

test("scanning examines every value in the worst case", () => {
  const costs = [0, 100].map((absent) => byScan(ARRIVED, absent).comparisons);

  expect(costs).toEqual([ARRIVED.length, ARRIVED.length]);
});

test("ordering makes the question cheaper the larger it gets", () => {
  const small = Array.from({ length: 128 }, (_, at) => at);
  const large = Array.from({ length: 1024 }, (_, at) => at);
  const worst = (values: readonly number[]) =>
    Math.max(...values.map((value) => byHalving(values, value).comparisons));

  // Eight times the values, three more comparisons, not eight times as many.
  // Stated without a chosen multiplier: scanning to the far end reads every
  // value, and halving never exceeds the halvings that reach one.
  expect({
    growth: worst(large) - worst(small),
    scanToTheEnd: byScan(large, 1023).comparisons,
    worstHalving: worst(large),
  }).toEqual({ growth: 3, scanToTheEnd: 1024, worstHalving: 11 });
});

test("one question does not repay the ordering", () => {
  // A scan reads at most every value once. Any sort must read every value at
  // least once before it can order them, so for a single question the scan
  // cannot lose.
  const values = Array.from({ length: 512 }, (_, at) => at);

  expect(byScan(values, 511).comparisons).toBeLessThanOrEqual(values.length);
});

test("ordering destroys the arrival order", () => {
  const justValues = [...ARRIVED].sort((left, right) => left - right);

  // Nothing in that result says 8 arrived last. The position is gone.
  expect({ position: justValues.indexOf(8), values: justValues }).toEqual({
    position: 1,
    values: ORDERED,
  });
});

test("carrying the position is the only way back", () => {
  const placed = sortedWithOrigin(ARRIVED);
  const eight = placed.find((entry) => entry.value === 8);

  expect({
    origins: placed.map((entry) => entry.origin),
    recovered: eight === undefined ? undefined : ARRIVED[eight.origin],
    values: placed.map((entry) => entry.value),
  }).toEqual({ origins: [1, 4, 3, 0, 2], recovered: 8, values: ORDERED });
});

test("equal values keep their arrival order", () => {
  // Stability, stated as a test. The two 7s must come back in the order they
  // arrived, which is what lets two sorts be combined.
  const sevens = sortedWithOrigin([7, 3, 7, 1])
    .filter((entry) => entry.value === 7)
    .map((entry) => entry.origin);

  expect(sevens).toEqual([0, 2]);
});

test("an empty collection orders to nothing", () => {
  expect({
    halving: byHalving([], 1),
    placed: sortedWithOrigin([]),
  }).toEqual({ halving: { comparisons: 0, index: undefined }, placed: [] });
});

test("a single value", () => {
  expect({
    halving: byHalving([9], 9).index,
    placed: sortedWithOrigin([9]),
  }).toEqual({ halving: 0, placed: [{ origin: 0, value: 9 }] });
});
