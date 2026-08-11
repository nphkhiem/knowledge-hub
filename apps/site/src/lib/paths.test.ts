import { expect, test } from "vitest";

import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";

import { LEARNING_PATHS, summarizePaths } from "./paths.js";

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

test("describes the declared path even before it is fully written", () => {
  const [path] = summarizePaths([lesson({ slug: "two-pointers", order: 2 })]);

  expect({
    slug: path?.slug,
    title: path?.title,
    publishedCount: path?.publishedCount,
    totalCount: path?.totalCount,
  }).toEqual({
    slug: "interview-foundations",
    title: "Interview Foundations",
    publishedCount: 1,
    totalCount: 15,
  });
});

test("orders the path by reading order", () => {
  const [path] = summarizePaths([
    lesson({ slug: "third", order: 9 }),
    lesson({ slug: "first", order: 1 }),
    lesson({ slug: "second", order: 4 }),
  ]);

  expect(path?.lessons.map((item) => item.slug)).toEqual([
    "first",
    "second",
    "third",
  ]);
});

test("reports domain composition and total reading time", () => {
  const [path] = summarizePaths([
    lesson({ slug: "a", order: 1, durationMinutes: 4 }),
    lesson({ slug: "b", order: 2, domain: "networking", durationMinutes: 6 }),
  ]);

  expect({
    minutes: path?.totalMinutes,
    domains: path?.domains,
  }).toEqual({ minutes: 10, domains: ["dsa", "networking"] });
});

test("still describes a path with nothing published yet", () => {
  // The path is declared, not derived, so it exists before its lessons do.
  const [path] = summarizePaths([]);

  expect({
    lessons: path?.lessons,
    publishedCount: path?.publishedCount,
    totalMinutes: path?.totalMinutes,
  }).toEqual({ lessons: [], publishedCount: 0, totalMinutes: 0 });
});

test("every declared path carries the copy a page needs", () => {
  for (const path of LEARNING_PATHS) {
    expect(
      {
        slug: path.slug,
        hasTitle: path.title.length > 0,
        hasPurpose: path.purpose.length > 0,
      },
      `path ${path.slug} is missing copy`,
    ).toEqual({ slug: path.slug, hasTitle: true, hasPurpose: true });
  }
});
