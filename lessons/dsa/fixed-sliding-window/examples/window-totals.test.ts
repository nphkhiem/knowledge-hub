import { expect, test } from "vitest";

import {
  bestWindowTotal,
  byRescan,
  bySliding,
  windowCount,
} from "./window-totals.js";

const VALUES = [5, 1, 8, 2, 3, 7];
const WIDTH = 3;

test("both approaches agree at every width", () => {
  const disagreements: number[] = [];

  for (let width = 1; width <= VALUES.length; width += 1) {
    const sliding = bySliding(VALUES, width).totals;
    const rescan = byRescan(VALUES, width).totals;
    if (JSON.stringify(sliding) !== JSON.stringify(rescan)) {
      disagreements.push(width);
    }
  }

  expect(disagreements).toEqual([]);
});

test("the lesson's windows", () => {
  expect(bySliding(VALUES, WIDTH).totals).toEqual([14, 11, 13, 12]);
});

test("the largest window is the first", () => {
  expect(bestWindowTotal(VALUES, WIDTH)).toBe(14);
});

test("every move after the first window costs exactly two", () => {
  // The property the lesson teaches: a move removes one value and adds one,
  // whatever the width.
  const wrong: number[] = [];

  for (let width = 1; width <= VALUES.length; width += 1) {
    const scan = bySliding(VALUES, width);
    const moves = scan.totals.length - 1;
    if (scan.operations - width !== 2 * moves) wrong.push(width);
  }

  expect(wrong).toEqual([]);
});

test("sliding does less arithmetic when there is overlap to exploit", () => {
  for (let width = 3; width < VALUES.length; width += 1) {
    expect(bySliding(VALUES, width).operations).toBeLessThan(
      byRescan(VALUES, width).operations,
    );
  }
});

test("one window saves nothing", () => {
  // A window as wide as the sequence never moves, so there is nothing to
  // repair and both approaches do identical work.
  expect(bySliding(VALUES, VALUES.length).operations).toBe(
    byRescan(VALUES, VALUES.length).operations,
  );
});

test("repairing is not worth it at width one", () => {
  // Honest edge: with nothing overlapping, the repair costs more than the
  // rebuild it replaces.
  expect(bySliding(VALUES, 1).operations).toBeGreaterThan(
    byRescan(VALUES, 1).operations,
  );
});

test("a window as wide as the sequence has one position", () => {
  expect(bySliding(VALUES, VALUES.length).totals).toEqual([26]);
});

test("a window wider than the sequence has none", () => {
  expect(bySliding(VALUES, VALUES.length + 1).totals).toEqual([]);
  expect(bestWindowTotal(VALUES, VALUES.length + 1)).toBeUndefined();
});

test("an empty sequence has no windows", () => {
  expect(bySliding([], 3).totals).toEqual([]);
});

test("a width of zero or less has no windows", () => {
  expect(windowCount(VALUES.length, 0)).toBe(0);
  expect(bySliding(VALUES, 0).totals).toEqual([]);
  expect(byRescan(VALUES, -1).totals).toEqual([]);
});

test("negative values repair correctly", () => {
  const values = [4, -2, 6, -1];
  expect(bySliding(values, 2).totals).toEqual(byRescan(values, 2).totals);
});
