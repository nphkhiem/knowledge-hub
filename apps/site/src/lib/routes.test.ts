import { expect, test } from "vitest";
import { ROUTES, joinBase, lessonPath } from "./routes";

test("builds the canonical lesson path from a domain and slug", () => {
  expect({
    dsa: lessonPath("dsa", "two-pointers"),
    networking: lessonPath("networking", "url-to-response"),
  }).toEqual({
    dsa: "/lessons/dsa/two-pointers/",
    networking: "/lessons/networking/url-to-response/",
  });
});

test("the hardcoded Two Pointers route agrees with the built one", () => {
  // Two ways of naming the same page must not drift apart.
  expect(lessonPath("dsa", "two-pointers")).toBe(ROUTES.twoPointers);
});

test("prefixes an internal path with a project base", () => {
  expect({
    home: joinBase("/knowledge-hub/", "/"),
    lesson: joinBase("/knowledge-hub/", "/lessons/dsa/two-pointers/"),
  }).toEqual({
    home: "/knowledge-hub/",
    lesson: "/knowledge-hub/lessons/dsa/two-pointers/",
  });
});

test("leaves paths alone when the site is served from the root", () => {
  expect({
    home: joinBase("/", "/"),
    lesson: joinBase("/", "/lessons/dsa/two-pointers/"),
  }).toEqual({ home: "/", lesson: "/lessons/dsa/two-pointers/" });
});

test("never produces a doubled or missing slash at the join", () => {
  const bases = ["/knowledge-hub", "/knowledge-hub/", "/", ""];
  const paths = ["/lessons/", "lessons/"];

  const joined = bases.flatMap((base) =>
    paths.map((path) => joinBase(base, path)),
  );

  expect({
    doubled: joined.filter((url) => url.includes("//")),
    missing: joined.filter((url) => !url.includes("/lessons/")),
  }).toEqual({ doubled: [], missing: [] });
});
