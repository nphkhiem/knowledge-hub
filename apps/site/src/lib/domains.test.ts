import { expect, test } from "vitest";

import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";

import { DOMAIN_DEFINITIONS, summarizeDomains } from "./domains.js";

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

test("groups lessons under the domain they belong to", () => {
  const domains = summarizeDomains([
    lesson({ slug: "two-pointers", order: 2 }),
    lesson({ slug: "url-to-response", order: 8, domain: "networking" }),
    lesson({ slug: "binary-search", order: 5 }),
  ]);

  expect(
    domains.map((entry) => ({
      domain: entry.domain,
      slugs: entry.lessons.map((item) => item.slug),
    })),
  ).toEqual([
    { domain: "dsa", slugs: ["two-pointers", "binary-search"] },
    { domain: "networking", slugs: ["url-to-response"] },
  ]);
});

test("omits a domain with no published lessons", () => {
  // system-design has no content yet. A page promising an empty shelf is worse
  // than no page, and an empty route would also be a dead link from anywhere.
  const domains = summarizeDomains([
    lesson({ slug: "two-pointers", order: 2 }),
  ]);

  expect(domains.map((entry) => entry.domain)).toEqual(["dsa"]);
});

test("recommends the earliest lesson as the starting point", () => {
  const domains = summarizeDomains([
    lesson({ slug: "later", order: 9 }),
    lesson({ slug: "earliest", order: 1 }),
  ]);

  expect(domains[0]?.startHere.slug).toBe("earliest");
});

test("counts lessons and their total reading time per domain", () => {
  const domains = summarizeDomains([
    lesson({ slug: "a", order: 1, durationMinutes: 4 }),
    lesson({ slug: "b", order: 2, durationMinutes: 6 }),
    lesson({ slug: "c", order: 3, domain: "networking", durationMinutes: 5 }),
  ]);

  expect(
    domains.map((entry) => ({
      domain: entry.domain,
      count: entry.lessons.length,
      minutes: entry.totalMinutes,
    })),
  ).toEqual([
    { domain: "dsa", count: 2, minutes: 10 },
    { domain: "networking", count: 1, minutes: 5 },
  ]);
});

test("describes an empty catalog as no domains rather than throwing", () => {
  expect(summarizeDomains([])).toEqual([]);
});

test("every domain the schema allows has a definition to render", () => {
  // A domain without copy would publish a page with a blank introduction.
  expect(Object.keys(DOMAIN_DEFINITIONS).sort()).toEqual([
    "dsa",
    "networking",
    "system-design",
  ]);
});
