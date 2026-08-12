# Catalog assumptions

The discovery layer was designed and shipped while exactly one lesson existed. That is not a small caveat. With a catalog of one, most of its decisions are not merely unverified, they are **unfalsifiable**: no input exists that could show them wrong.

This document names the five that matter, and `tests/e2e/catalog-growth.spec.ts` makes the catalog growing past one lesson force each of them back into view.

Two of the five are real assertions that cannot be silenced without making a decision. Three are review prompts that a machine cannot judge. The difference is stated per item rather than left for you to guess, because a checklist that mixes proofs and prompts without saying which is which teaches people to trust all of it equally.

## 1. Search ranking has never ranked anything

**Kind: prompt.**

`apps/site/src/lib/search.ts` scores an exact title match 100, a title substring 50, a recognition signal 20, and objective text 10, then sorts, breaking ties on reading order.

With one record, `sort` on a one-element array is a no-op. Every query returns either that lesson or nothing. The weighting has never ordered two things, and neither has the tie-break. The unit tests exercise it against three synthetic records invented alongside the function, which tests the code and not the weighting's fitness for real lesson titles.

**What to do when it trips.** Search a term that several real lessons plausibly match, such as `order`, `search`, or `linear`. Ask whether the returned order is the order you would have picked. Pay attention to whether recognition signals should outrank objective text, which is a guess today.

## 2. The authoring contract is proven circularly

**Kind: prompt.**

The schema, the compiler, and the five primitives (array, pointer, label, comparison, result) were designed alongside the one lesson that validates them. That is a closed loop: the contract was fitted to Two Pointers and then verified against Two Pointers.

The first-slice plan said the slice must prove one complete lesson before the schema or primitive catalog expands. The second lesson is the first genuine test of whether the contract generalizes or whether it encoded one lesson's shape by accident.

**What to do when it trips.** Ask what the new lesson needed that did not already exist. A sixth primitive, a new action, or a field added to the schema is a signal that the contract was fitted rather than designed, and the cost of that compounds across a fifteen-lesson collection. Discovering it at lesson two is cheap; discovering it at lesson nine is not.

## 3. Displayed position against declared order

**Kind: assertion.** Defended by `tests/e2e/catalog-growth.spec.ts`.

A lesson row shows a numeral, and it means different things by surface. On a path surface it is the lesson's place in a curriculum, so it renders `lesson.order`. On a list surface, Explore results or a domain index, it ordinates the list in front of the reader, so it renders the index.

This distinction was invisible while one lesson existed, and it was wrong: the path page showed Two Pointers as `01` although it is `order: 2` of Interview Foundations, implying it was the first lesson of the path when "Complexity as a Budget" is. Corrected on 2026-08-11.

The test asserts that every numeral on a path surface equals its lesson's declared order. It stays true trivially while published orders are contiguous, and fails at the first gap, which cannot be resolved without deciding what a reader should see.

## 4. Previous and Next have never rendered

**Kind: assertion.** Defended by `tests/e2e/catalog-growth.spec.ts`.

`PreviousNextLessons.astro` accepts published neighbors only and therefore renders nothing on every page today, because one lesson has no neighbor. It is the one navigation component with no exercise at all.

The test asserts that when two lessons share a collection, a lesson page offers a link to its neighbor. It is vacuously satisfied now and becomes a real check the moment a second lesson lands.

## 5. Aggregate arithmetic is trivially true

**Kind: prompt.**

"1 of 15 lessons published, 4 minutes of reading in DSA" sums one number over a set of one domain. Totals, domain composition, and de-duplication are all correct in the way that any function is correct on a single input.

**What to do when it trips.** Read the summary sentences on Home, the path page, and the domain page against the catalog and confirm the arithmetic and the plurals. A pluralization bug of exactly this kind already shipped once and was caught in a browser rather than by a unit test: the summary read "Showing all 1 lessons."

## Reviewed at two lessons, 2026-08-12

"Complexity as a Budget" was the first growth. What the review found:

**1, ranking.** The tie-break works. Queries matching both lessons return them in reading order, verified for the first time. A real gap surfaced beside it: the index covers only title, objective, and recognition signals, so a term central to a lesson's prose finds nothing. Searching `scan` returns no results although one lesson is entirely about scans. Indexing lesson body text is now an open question rather than a hypothetical.

**2, schema generality.** Better than predicted. The lesson needed no new primitive; `array`, `pointer`, `label`, `move`, and `highlight` sufficed. Two rough edges: labels cannot change text, because `set` supports only `result.status`, so a lesson about a counter has to represent it as a second array consumed by highlights; and `scene.target` is a required number that means nothing outside a target-sum lesson, so it was set arbitrarily to satisfy the schema.

**5, aggregates.** Found two real defects on first contact. Home read "2 of 15 lessons  published" with a doubled space, and Explore's prerendered summary read "Showing all 2lessons" with none. The second had been wrong since Explore shipped and no test caught it, because every browser test runs with JavaScript, which replaces that text. It was only ever visible to readers without scripting.

**6, discovered rather than predicted: the renderer is single-array by construction.** `createRenderContext` finds one array object and computes one geometry from it, so every array primitive draws at the same `ARRAY_TOP` with cell widths sized for the first one. Two arrays overlap their labels and the wider one overflows the figure. This was invisible while one lesson existed because that lesson has one array. **Fixed 2026-08-12.** Geometry is now per-array: each array occupies its own band, offset by `ROW_STRIDE`, and sizes its cells from its own length. Vertical positions in the array and pointer primitives derive from the array's own `top` rather than from module constants, so a single-array figure renders byte-identically and the viewBox grows only when a figure carries more than one array.

**7, discovered rather than predicted: the test suite encoded the catalog size.** Ten assertions across four specs asserted exactly one lesson. They failed on the second lesson for no product reason at all. Assertions about a catalog should be relative to what is published, or they break every time content lands.

**3 and 4** were defended by their assertions. Item 4 fired correctly and Previous/Next was built to satisfy it: the component had been complete since F09 and was simply never passed any props.

## Why this exists as tests rather than a note

Earlier notes about this project went stale without anyone noticing: a roadmap whose checkboxes lagged reality by two milestones, a handoff describing an administrator bypass that never existed, and design documents describing a feature deleted the day before. Each was prose, and prose does not fail.

The tripwires are tests so that the pull request adding a second lesson cannot merge without confronting them.
