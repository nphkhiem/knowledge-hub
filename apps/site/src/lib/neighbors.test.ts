import { expect, test } from "vitest";

import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";

import { findNeighbors } from "./neighbors.js";

function lesson(slug: string, order: number): CompiledLesson {
  return {
    collection: "interview-foundations",
    difficulty: "easy",
    domain: "dsa",
    order,
    slug,
    title: slug,
  } as CompiledLesson;
}

const catalog = [lesson("first", 1), lesson("second", 2), lesson("third", 5)];

test("offers the next lesson to the first in the order", () => {
  expect(findNeighbors(catalog, catalog[0]!)).toEqual({
    next: { title: "second", href: "/lessons/dsa/second/" },
  });
});

test("offers both neighbors to a lesson in the middle", () => {
  expect(findNeighbors(catalog, catalog[1]!)).toEqual({
    previous: { title: "first", href: "/lessons/dsa/first/" },
    next: { title: "third", href: "/lessons/dsa/third/" },
  });
});

test("offers only the previous lesson to the last in the order", () => {
  expect(findNeighbors(catalog, catalog[2]!)).toEqual({
    previous: { title: "second", href: "/lessons/dsa/second/" },
  });
});

test("neighbors follow declared order, not a gap-free sequence", () => {
  // second is order 2 and third is order 5. A gap must not break adjacency.
  expect(findNeighbors(catalog, catalog[1]!).next?.title).toBe("third");
});

test("a lone lesson has no neighbors", () => {
  const only = lesson("only", 1);

  expect(findNeighbors([only], only)).toEqual({});
});

test("neighbors stay inside the lesson's own collection", () => {
  const other = {
    ...lesson("elsewhere", 3),
    collection: "other",
  } as unknown as CompiledLesson;

  expect(findNeighbors([catalog[0]!, other], catalog[0]!)).toEqual({});
});
