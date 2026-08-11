import { expect, test } from "vitest";

import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";

import {
  INTERVIEW_FOUNDATIONS_TOTAL,
  summarizeCollection,
} from "./collection.js";

/**
 * Only the fields the collection summary reads. Building a whole CompiledLesson
 * here would couple these tests to parts of the contract they do not exercise.
 */
function lesson(
  overrides: Partial<CompiledLesson> & Pick<CompiledLesson, "slug" | "order">,
): CompiledLesson {
  return {
    collection: "interview-foundations",
    domain: "dsa",
    durationMinutes: 4,
    objective: `Objective for ${overrides.slug}`,
    title: overrides.slug,
    ...overrides,
  } as CompiledLesson;
}

test("orders lessons by their declared order, not by catalog order", () => {
  const summary = summarizeCollection(
    [
      lesson({ slug: "later", order: 9 }),
      lesson({ slug: "first", order: 2 }),
      lesson({ slug: "middle", order: 5 }),
    ],
    "interview-foundations",
  );

  expect(summary.lessons.map((item) => item.slug)).toEqual([
    "first",
    "middle",
    "later",
  ]);
});

test("summarizes what is published against what is planned", () => {
  const summary = summarizeCollection(
    [
      lesson({ slug: "two-pointers", order: 2, durationMinutes: 4 }),
      lesson({
        slug: "url-to-response",
        order: 8,
        durationMinutes: 6,
        domain: "networking",
      }),
    ],
    "interview-foundations",
  );

  expect({
    publishedCount: summary.publishedCount,
    totalCount: summary.totalCount,
    totalMinutes: summary.totalMinutes,
    domains: summary.domains,
    isComplete: summary.isComplete,
  }).toEqual({
    publishedCount: 2,
    totalCount: INTERVIEW_FOUNDATIONS_TOTAL,
    totalMinutes: 10,
    domains: ["dsa", "networking"],
    isComplete: false,
  });
});

test("excludes lessons belonging to another collection", () => {
  const summary = summarizeCollection(
    [
      lesson({ slug: "included", order: 1 }),
      lesson({
        slug: "excluded",
        order: 2,
        collection: "something-else" as CompiledLesson["collection"],
      }),
    ],
    "interview-foundations",
  );

  expect(summary.lessons.map((item) => item.slug)).toEqual(["included"]);
});

test("reports each domain once, in a stable order", () => {
  const summary = summarizeCollection(
    [
      lesson({ slug: "c", order: 3, domain: "system-design" }),
      lesson({ slug: "a", order: 1, domain: "dsa" }),
      lesson({ slug: "b", order: 2, domain: "dsa" }),
    ],
    "interview-foundations",
  );

  expect(summary.domains).toEqual(["dsa", "system-design"]);
});

test("describes an empty catalog without throwing", () => {
  const summary = summarizeCollection([], "interview-foundations");

  expect({
    lessons: summary.lessons,
    publishedCount: summary.publishedCount,
    totalMinutes: summary.totalMinutes,
    domains: summary.domains,
    isComplete: summary.isComplete,
  }).toEqual({
    lessons: [],
    publishedCount: 0,
    totalMinutes: 0,
    domains: [],
    isComplete: false,
  });
});

test("the declared total matches the approved collection size", () => {
  // CONTEXT.md: Interview Foundations is exactly fifteen lessons, seven DSA,
  // two networking, and six system design. Pinned so it cannot drift silently.
  expect(INTERVIEW_FOUNDATIONS_TOTAL).toBe(15);
});
