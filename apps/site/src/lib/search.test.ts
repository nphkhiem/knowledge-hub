import { expect, test } from "vitest";

import type { SearchRecord } from "./search.js";
import { describeFilters, parseFilters, searchLessons } from "./search.js";

const records: SearchRecord[] = [
  {
    slug: "two-pointers",
    difficulty: "easy",
    domain: "dsa",
    collection: "interview-foundations",
    order: 2,
    title: "Two Pointers",
    objective: "Discard impossible candidates without checking every pair.",
    durationMinutes: 4,
    terms: ["two pointers", "sorted", "pair sum"],
  },
  {
    slug: "binary-search",
    difficulty: "easy",
    domain: "dsa",
    collection: "interview-foundations",
    order: 5,
    title: "Binary Search",
    objective: "Halve an ordered range until the answer is found.",
    durationMinutes: 5,
    terms: ["binary search", "ordered", "midpoint"],
  },
  {
    slug: "url-to-response",
    difficulty: "easy",
    domain: "networking",
    collection: "interview-foundations",
    order: 8,
    title: "URL to Response",
    objective: "Follow a request from DNS through to a rendered response.",
    durationMinutes: 6,
    terms: ["dns", "tls", "http"],
  },
];

test("returns every lesson in reading order when nothing is asked", () => {
  const results = searchLessons(records, {});

  expect(results.map((item) => item.slug)).toEqual([
    "two-pointers",
    "binary-search",
    "url-to-response",
  ]);
});

test("ranks a title match above a body match", () => {
  const results = searchLessons(records, { query: "search" });

  // "Binary Search" matches by title; "URL to Response" only by objective text.
  expect(results.map((item) => item.slug)).toEqual(["binary-search"]);
});

test("matches a recognition term that appears in no title", () => {
  expect(searchLessons(records, { query: "dns" }).map((r) => r.slug)).toEqual([
    "url-to-response",
  ]);
});

test("ignores case and surrounding whitespace", () => {
  expect(
    searchLessons(records, { query: "  TWO PoInTeRs " }).map((r) => r.slug),
  ).toEqual(["two-pointers"]);
});

test("filters by domain", () => {
  expect(searchLessons(records, { domain: "dsa" }).map((r) => r.slug)).toEqual([
    "two-pointers",
    "binary-search",
  ]);
});

test("combines a query with a domain filter", () => {
  expect(
    searchLessons(records, { query: "ordered", domain: "dsa" }).map(
      (r) => r.slug,
    ),
  ).toEqual(["binary-search"]);
});

test("returns nothing for a term no lesson carries", () => {
  expect(searchLessons(records, { query: "kubernetes" })).toEqual([]);
});

test("is deterministic for equally relevant results", () => {
  // Both DSA lessons match; reading order breaks the tie, not catalog order.
  const once = searchLessons(records, { query: "the" });
  const twice = searchLessons([...records].reverse(), { query: "the" });

  expect(once.map((r) => r.slug)).toEqual(twice.map((r) => r.slug));
});

test("reads filters from a query string", () => {
  expect(
    parseFilters(new URLSearchParams("q=two+pointers&domain=dsa&path=x")),
  ).toEqual({
    query: "two pointers",
    domain: "dsa",
    path: "x",
  });
});

test("ignores parameters it does not understand", () => {
  // `saved=1` was a bookmark filter before the site dropped learner state. A
  // shared old link must still work rather than erroring.
  expect(
    parseFilters(new URLSearchParams("q=pair&saved=1&nonsense=9")),
  ).toEqual({ query: "pair" });
});

test("ignores a domain that is not a real domain", () => {
  expect(parseFilters(new URLSearchParams("domain=astrology"))).toEqual({});
});

test("explains the active filters in plain language", () => {
  expect({
    none: describeFilters({}, 3),
    oneOfOne: describeFilters({}, 1),
    query: describeFilters({ query: "pair" }, 1),
    domain: describeFilters({ domain: "dsa" }, 2),
    both: describeFilters({ query: "pair", domain: "dsa" }, 1),
    empty: describeFilters({ query: "kubernetes" }, 0),
  }).toEqual({
    none: "Showing all 3 lessons.",
    // Caught in a browser first: the unfiltered branch hardcoded the plural and
    // read "Showing all 1 lessons." with a single published lesson.
    oneOfOne: "Showing all 1 lesson.",
    query: '1 lesson matching "pair".',
    domain: "2 lessons in DSA.",
    both: '1 lesson matching "pair" in DSA.',
    empty: 'No lessons matching "kubernetes".',
  });
});
