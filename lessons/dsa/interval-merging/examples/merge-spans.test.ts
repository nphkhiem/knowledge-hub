import { expect, test } from "vitest";

import {
  coveredByBruteForce,
  coveredUnits,
  gapsBetween,
  mergeSorted,
  sweepOnly,
  type Span,
} from "./merge-spans.js";

const BOOKINGS: Span[] = [
  [1, 3],
  [2, 6],
  [5, 8],
  [10, 12],
  [11, 13],
];

/** A tiny deterministic generator, so a failure is reproducible. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

test("the lesson's bookings", () => {
  expect(mergeSorted(BOOKINGS)).toEqual([
    [1, 8],
    [10, 13],
  ]);
});

test("a gap closes a group", () => {
  expect(gapsBetween(BOOKINGS)).toEqual([[8, 10]]);
});

test("a span inside another does not shrink it", () => {
  // The classic defect: taking the joining span's end rather than the larger of
  // the two. Invisible until one span nests inside another.
  expect(
    mergeSorted([
      [1, 9],
      [2, 4],
    ]),
  ).toEqual([[1, 9]]);
});

test("touching spans merge", () => {
  // A decision rather than a fact, pinned so a caller knows which.
  expect(
    mergeSorted([
      [1, 4],
      [4, 7],
    ]),
  ).toEqual([[1, 7]]);
});

test("the sort is a precondition, not a tidying step", () => {
  // Not a warning in prose. The unsorted sweep returns a plausible, shorter
  // list of real spans, and it is wrong.
  const shuffled: Span[] = [
    [10, 12],
    [1, 3],
    [2, 6],
  ];

  expect({
    sorted: mergeSorted(shuffled),
    unsortedDiffers:
      JSON.stringify(sweepOnly(shuffled)) !==
      JSON.stringify(mergeSorted(shuffled)),
  }).toEqual({
    sorted: [
      [1, 6],
      [10, 12],
    ],
    unsortedDiffers: true,
  });
});

test("merging agrees with counting every unit", () => {
  // The property, against a reference too slow to use, over random input.
  const random = seeded(11);
  const wrong: string[] = [];

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const spans: Span[] = [];
    const count = Math.floor(random() * 7);
    for (let at = 0; at < count; at += 1) {
      const start = Math.floor(random() * 19);
      spans.push([start, start + Math.floor(random() * 6)]);
    }
    if (coveredUnits(spans) !== coveredByBruteForce(spans, 30)) {
      wrong.push(JSON.stringify(spans));
    }
  }

  expect(wrong).toEqual([]);
});

test("merged spans come out sorted and disjoint", () => {
  const random = seeded(29);
  const wrong: string[] = [];

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const spans: Span[] = Array.from({ length: 5 }, () => {
      const start = Math.floor(random() * 19);
      return [start, start + Math.floor(random() * 5)] as Span;
    });
    const merged = mergeSorted(spans);
    for (let at = 0; at + 1 < merged.length; at += 1) {
      // Sorted, and separated by a real gap rather than touching.
      if ((merged[at]?.[1] ?? 0) >= (merged[at + 1]?.[0] ?? 0)) {
        wrong.push(JSON.stringify(spans));
      }
    }
  }

  expect(wrong).toEqual([]);
});

test("no spans", () => {
  expect({ gaps: gapsBetween([]), merged: mergeSorted([]) }).toEqual({
    gaps: [],
    merged: [],
  });
});

test("identical spans collapse to one", () => {
  expect(
    mergeSorted([
      [2, 5],
      [2, 5],
      [2, 5],
    ]),
  ).toEqual([[2, 5]]);
});

test("a zero length span is kept", () => {
  // A booking of no duration is still a real record, and dropping it silently
  // would lose data the caller supplied.
  expect(mergeSorted([[4, 4]])).toEqual([[4, 4]]);
});
