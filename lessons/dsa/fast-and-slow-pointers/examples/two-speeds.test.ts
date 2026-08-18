import { expect, test } from "vitest";

import {
  END,
  cycleEntrance,
  hasCycle,
  middleByCounting,
  middleByTwoSpeeds,
  stepsTaken,
} from "./two-speeds.js";

const READINGS = [4, 8, 15, 16, 23, 42, 9];

/** A straight chain of `length` nodes, ending rather than looping. */
function chain(length: number): number[] {
  return Array.from({ length }, (_, at) => (at === length - 1 ? END : at + 1));
}

/** A chain whose last node points back to `entrance`. */
function looped(length: number, entrance: number): number[] {
  return Array.from({ length }, (_, at) =>
    at === length - 1 ? entrance : at + 1,
  );
}

test("the lesson's readings", () => {
  expect({
    middle: middleByTwoSpeeds(READINGS),
    value: READINGS[3],
  }).toEqual({ middle: 3, value: 16 });
});

test("both ways of finding the middle agree", () => {
  const wrong: number[] = [];

  for (let length = 1; length < 60; length += 1) {
    const values = Array.from({ length }, (_, at) => at);
    if (middleByTwoSpeeds(values) !== middleByCounting(values)) {
      wrong.push(length);
    }
  }

  expect(wrong).toEqual([]);
});

test("it is one pass", () => {
  // The fast position takes two steps per round and stops at the end, so the
  // rounds cannot exceed half the length. Nothing walks twice.
  const over: number[] = [];

  for (let length = 1; length < 60; length += 1) {
    const values = Array.from({ length }, (_, at) => at);
    if (stepsTaken(values) > Math.floor((length + 1) / 2)) over.push(length);
  }

  expect(over).toEqual([]);
});

test("an even length returns the later middle", () => {
  // A convention rather than a discovery, pinned so a caller can rely on it.
  expect(middleByTwoSpeeds([0, 1, 2, 3])).toBe(2);
});

test("an empty sequence has no middle", () => {
  expect([middleByTwoSpeeds([]), middleByCounting([])]).toEqual([
    undefined,
    undefined,
  ]);
});

test("a single value is its own middle", () => {
  expect(middleByTwoSpeeds([9])).toBe(0);
});

test("a straight chain has no cycle", () => {
  const wrong = Array.from({ length: 29 }, (_, at) => at + 1).filter((length) =>
    hasCycle(chain(length)),
  );

  expect(wrong).toEqual([]);
});

test("a looping chain has one, and its entrance is found rather than assumed", () => {
  // The meeting point is generally not the entrance. This checks the second
  // phase against chains whose entrance is known by construction.
  const wrong: string[] = [];

  for (let length = 2; length < 30; length += 1) {
    for (let entrance = 0; entrance < length - 1; entrance += 1) {
      const nexts = looped(length, entrance);
      if (!hasCycle(nexts) || cycleEntrance(nexts) !== entrance) {
        wrong.push(`${length} entering at ${entrance}`);
      }
    }
  }

  expect(wrong).toEqual([]);
});

test("no entrance without a cycle", () => {
  expect(cycleEntrance(chain(10))).toBeUndefined();
});

test("a node pointing at itself is a cycle", () => {
  expect({ cycle: hasCycle([0]), entrance: cycleEntrance([0]) }).toEqual({
    cycle: true,
    entrance: 0,
  });
});
