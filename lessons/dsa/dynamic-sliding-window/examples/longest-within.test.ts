import { expect, test } from "vitest";

import { byEveryStart, byExhaustive, byWindow } from "./longest-within.js";

const READINGS = [2, 3, 1, 4, 2];
const BUDGET = 6;

test("the lesson's readings", () => {
  expect(byWindow(READINGS, BUDGET).width).toBe(3);
});

test("the window matches the truth on non-negative values", () => {
  const wrong: string[] = [];

  for (const values of [
    [],
    [5],
    READINGS,
    [1, 1, 1, 1],
    [0, 0, 4, 0],
    [9, 9],
  ]) {
    for (let budget = 0; budget <= 11; budget += 1) {
      if (byWindow(values, budget).width !== byExhaustive(values, budget)) {
        wrong.push(`${JSON.stringify(values)} within ${budget}`);
      }
    }
  }

  expect(wrong).toEqual([]);
});

test("both approaches agree on non-negative values", () => {
  const wrong: string[] = [];

  for (const values of [[], [5], READINGS, [1, 1, 1, 1, 1, 1], [9, 9, 9]]) {
    for (let budget = 0; budget <= 11; budget += 1) {
      if (
        byWindow(values, budget).width !== byEveryStart(values, budget).width
      ) {
        wrong.push(`${JSON.stringify(values)} within ${budget}`);
      }
    }
  }

  expect(wrong).toEqual([]);
});

test("each value is read at most twice", () => {
  // The property the lesson teaches. Each edge crosses the values once, so the
  // total reads cannot exceed two per value however much the window grows and
  // shrinks in between.
  const over = [READINGS, Array(50).fill(1), Array(8).fill(3)].filter(
    (values: number[]) => byWindow(values, 6).reads > 2 * values.length,
  );

  expect(over).toEqual([]);
});

test("trying every start costs far more", () => {
  const values: number[] = Array(40).fill(1);

  expect({
    everyStart: byEveryStart(values, 6).reads > 5 * values.length,
    window: byWindow(values, 6).reads <= 2 * values.length,
  }).toEqual({ everyStart: true, window: true });
});

test("a budget below every value admits nothing", () => {
  expect(byWindow([4, 5, 6], 3).width).toBe(0);
});

test("a budget above the total admits everything", () => {
  expect(byWindow(READINGS, 100).width).toBe(READINGS.length);
});

test("an empty sequence has no stretch", () => {
  expect(byWindow([], 6)).toEqual({ reads: 0, width: 0 });
});

test("zeros extend a stretch for free", () => {
  expect(byWindow([0, 0, 0], 0).width).toBe(3);
});

test("a negative value makes the window wrong", () => {
  // Not a warning left in prose. The window returns a smaller answer than the
  // truth, with nothing to indicate anything went wrong.
  const values = [5, -4, 1];

  expect({
    truth: byExhaustive(values, 2),
    window: byWindow(values, 2).width,
  }).toEqual({ truth: 3, window: 2 });
});
