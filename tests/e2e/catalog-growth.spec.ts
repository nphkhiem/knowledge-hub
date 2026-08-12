import { expect, test, type Page } from "@playwright/test";

/**
 * Tripwires for the assumptions the discovery layer was built on while exactly
 * one lesson existed. See `docs/catalog-assumptions.md` for the reasoning.
 *
 * Two of these are assertions: they defend an invariant and cannot be silenced
 * without making a decision. Three are prompts: they fail once, when the
 * catalog first grows, to force a review a machine cannot perform. Each says
 * which it is, so a reader does not mistake a prompt for a proof.
 */

interface IndexedLesson {
  readonly slug: string;
  readonly order: number;
  readonly domain: string;
  readonly collection: string;
  readonly title: string;
}

/** The published catalog, read from the index Explore already embeds. */
async function readCatalog(page: Page): Promise<IndexedLesson[]> {
  await page.goto("explore/");
  const raw = await page.locator("[data-search-index]").textContent();
  const parsed: unknown = JSON.parse(raw ?? "[]");
  expect(Array.isArray(parsed), "the search index was not readable").toBe(true);
  return parsed as IndexedLesson[];
}

/** Numerals rendered beside each lesson on a surface, in document order. */
async function renderedPositions(page: Page, path: string): Promise<number[]> {
  await page.goto(path);
  return page
    .locator("[data-lesson-slug] .position")
    .evaluateAll((nodes) =>
      nodes.map((node) => Number((node.textContent ?? "").trim())),
    );
}

test("ASSERTION: path surfaces number lessons by declared order", async ({
  page,
}) => {
  // A path numeral is a place in a curriculum, not a place in a list. While
  // published orders are contiguous this holds trivially; it fails at the first
  // gap, which cannot be resolved without deciding what a reader should see.
  const catalog = await readCatalog(page);
  const foundations = catalog
    .filter((lesson) => lesson.collection === "interview-foundations")
    .sort((left, right) => left.order - right.order);

  const expected = foundations.map((lesson) => lesson.order);

  expect(await renderedPositions(page, "paths/interview-foundations/")).toEqual(
    expected,
  );
  expect(await renderedPositions(page, "./")).toEqual(expected);
});

test("ASSERTION: list surfaces number lessons sequentially", async ({
  page,
}) => {
  // The counterpart rule. Search results numbered 02, 07, 11 would read as
  // arbitrary gaps rather than as an ordered list.
  const catalog = await readCatalog(page);
  const sequential = catalog.map((_, index) => index + 1);

  expect(await renderedPositions(page, "explore/")).toEqual(sequential);

  const dsa = catalog.filter((lesson) => lesson.domain === "dsa");
  expect(await renderedPositions(page, "domains/dsa/")).toEqual(
    dsa.map((_, index) => index + 1),
  );
});

test("ASSERTION: a lesson with a published neighbor offers a link to it", async ({
  page,
}) => {
  // PreviousNextLessons has never rendered anything, because one lesson has no
  // neighbor. Vacuous today; a real check the moment a second lesson lands.
  const catalog = await readCatalog(page);
  const foundations = catalog
    .filter((lesson) => lesson.collection === "interview-foundations")
    .sort((left, right) => left.order - right.order);

  test.skip(
    foundations.length < 2,
    "no lesson has a neighbor yet; see docs/catalog-assumptions.md item 4",
  );

  const first = foundations[0];
  const second = foundations[1];
  if (first === undefined || second === undefined) return;

  await page.goto(`lessons/${first.domain}/${first.slug}/`);
  await expect(
    page.getByRole("link", { name: new RegExp(second.title, "i") }),
    "the first lesson does not link to its published neighbor",
  ).toBeVisible();
});

test("PROMPT: review the five catalog assumptions once a second lesson exists", async ({
  page,
}) => {
  const catalog = await readCatalog(page);

  // This is a prompt, not a proof. It fails exactly once, when the catalog
  // first grows, because three of the five assumptions need a human judgement
  // that no assertion can stand in for.
  //
  // Before raising the number below, work through docs/catalog-assumptions.md:
  //
  //   1. Search ranking has never ordered two results. Search a term several
  //      lessons match and judge whether the order is the one you would pick.
  //   2. The schema was fitted to one lesson and verified against it. Ask what
  //      the new lesson needed that did not already exist.
  //   5. Every total and plural has only ever been computed over one lesson.
  //      Read the summary sentences on Home, the path, and the domain page.
  //
  // Items 3 and 4 are defended by the assertions above and need nothing here.
  expect(
    catalog.length,
    "The catalog grew. Work through docs/catalog-assumptions.md items 1, 2, and 5, then raise this number.",
  ).toBe(1);
});
