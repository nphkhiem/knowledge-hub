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

**1, ranking.** The tie-break works. Queries matching both lessons return them in reading order, verified for the first time. A real gap surfaced beside it: the index covers only title, objective, and recognition signals, so a term central to a lesson's prose finds nothing. Searching `scan` returns no results although one lesson is entirely about scans. **Resolved 2026-08-12**: the index now carries unique words from the lesson's prose, ordered by signal so application titles are indexed before the bodies they head. It is capped at ninety words per lesson, because the index ships inside the page: uncapped it cost 2.5 kB per lesson and would have reached about 81 kB across the planned curriculum, against 35 kB capped. `scan`, `duplicate`, `invariant`, and `quadratic` all resolve now; a prose match scores below every other kind.

**2, schema generality.** Better than predicted. The lesson needed no new primitive; `array`, `pointer`, `label`, `move`, and `highlight` sufficed. Two rough edges: labels cannot change text, because `set` supports only `result.status`, so a lesson about a counter has to represent it as a second array consumed by highlights; and `scene.target` was a required number that meant nothing outside a target-sum lesson, so it was set arbitrarily to satisfy the schema. **Removed 2026-08-12**: nothing ever read it, because the compiler copies only `scene.objects` and a comparison carries its own target. The schema now rejects it rather than ignoring it, so copies of the old shape cannot spread.

**5, aggregates.** Found two real defects on first contact. Home read "2 of 15 lessons  published" with a doubled space, and Explore's prerendered summary read "Showing all 2lessons" with none. The second had been wrong since Explore shipped and no test caught it, because every browser test runs with JavaScript, which replaces that text. It was only ever visible to readers without scripting.

**6, discovered rather than predicted: the renderer is single-array by construction.** `createRenderContext` finds one array object and computes one geometry from it, so every array primitive draws at the same `ARRAY_TOP` with cell widths sized for the first one. Two arrays overlap their labels and the wider one overflows the figure. This was invisible while one lesson existed because that lesson has one array. **Fixed 2026-08-12.** Geometry is now per-array: each array occupies its own band, offset by `ROW_STRIDE`, and sizes its cells from its own length. Vertical positions in the array and pointer primitives derive from the array's own `top` rather than from module constants, so a single-array figure renders byte-identically and the viewBox grows only when a figure carries more than one array.

**7, discovered rather than predicted: the test suite encoded the catalog size.** Ten assertions across four specs asserted exactly one lesson. They failed on the second lesson for no product reason at all. Assertions about a catalog should be relative to what is published, or they break every time content lands.

**3 and 4** were defended by their assertions. Item 4 fired correctly and Previous/Next was built to satisfy it: the component had been complete since F09 and was simply never passed any props.

## Reviewed at three lessons, 2026-08-12

"Hash Lookup as a Trade" was the second growth, and it answered item 2 far more sharply than the first did.

**1, ranking.** Sound across three. Searching `scan` returns Hash Lookup first because its objective says "removes a scan", ahead of two lessons matching only in prose, tie-broken by reading order. The weighting is behaving as designed on real content.

**2, schema generality. This is the real answer.** The second lesson needed nothing new; the third needed a new primitive (`buckets`), a new action (`insert`), and an extension of an existing one (`highlight`, which accepted only arrays). So the contract generalizes across lessons of the same shape and stops at the first lesson of a different shape. That is worth knowing before the remaining twenty-one DSA lessons: expect a new primitive roughly whenever a lesson's subject is not a sequence.

Two enforcement points had to change for one rule, because `applyAction` and `preflightActions` each carry their own copy of the action contract. Preflight exists to report every diagnostic at once rather than stopping at the first, so the duplication is deliberate, but it means an action rule is never changed in one place.

**5, aggregates.** Correct at three with no defects: `3 of 15`, twelve minutes, plurals right on every surface.

**7 recurred, and it was mine.** After documenting that the suite must not encode the catalog size, I hardcoded two lesson titles into `home.spec.ts` while fixing that very problem. It broke on the next lesson. The assertion now derives declared order from the page and checks it ascends, which cannot rot as content lands.

## Reviewed at five lessons, 2026-08-14

"Fixed Sliding Window" was the fourth growth, and it contradicted the rule the previous review wrote down.

**1, ranking.** Sound at five, and separating lessons for a reason rather than by luck. Searching `window` returns Fixed Sliding Window ahead of Prefix Sums, a title match over a prose match. Searching `total` returns them the other way round, because "the total of a range" is one of Prefix Sums' recognition signals while the other lesson matches only in its objective. That is the weighting doing what it was designed to do, and it is the first query where two lessons both genuinely matched and the ranking had to choose between them.

One property worth naming rather than rediscovering: the prose test is `includes`, a substring match over the joined words, so `sum` matches "sums" and "summing", and a short query can land inside a longer word. That is generous rather than wrong at this size, and it is the kind of thing that becomes wrong quietly.

**2, schema generality. The pattern recorded at three lessons predicted this one wrong.** That pattern said a lesson whose subject is a **sequence** needs no primitive work and ships as one pull request. Fixed Sliding Window's subject is a sequence, and it needed a new primitive, a new action, and two pull requests anyway.

The better rule, which fits all five lessons rather than the first four: **a lesson needs a new primitive when it puts a new thing on the screen, not when its data stops being a sequence.** A window is a new thing, a range over an array, even though the array underneath is the one Two Pointers already uses. Prefix Sums added nothing because a second array is still an array. Hash Lookup added `buckets` because buckets are not an array. On that reading the remaining tickets should be re-read for what the reader must *see*, not for what the data *is*, and the count of twelve lessons needing new primitives is a guess made under the old rule.

**5, aggregates.** Correct at five with no defects. Home reads "5 of 15 lessons published so far, 20 minutes of reading in DSA", the path detail "5 of 15 lessons published, 20 minutes of reading in DSA", the paths index "5 of 15 published", the DSA domain page "5 lessons published, 20 minutes of reading", and Explore "Showing all 5 lessons". The arithmetic and every plural check out.

**3 and 4** were defended by their assertions and needed no changes.

## Reviewed at six lessons, 2026-08-14

"Binary Search" was the fifth growth, and the first where the review changed the lesson rather than the code.

**1, ranking. A real defect, and it was authorial.** Searching `sorted` returned Two Pointers ahead of Binary Search. Neither lesson used the word in a title, objective, or recognition signal, so both scored only on prose and the tie broke on reading order, which put the lesson that is not about sorted data first.

The weighting was behaving correctly; the content was not. Binary Search's first recognition signal said "already in order" where a learner searches "sorted". Changed to say sorted, and the query now returns Binary Search first. **The lesson worth carrying: a recognition signal has to use the word a learner would type, not the word an author prefers.** Nothing in the pipeline can catch that, which is why this item is a prompt.

`search`, `half`, and `middle` all return Binary Search first on their own merits. `order` still returns Two Pointers first, which is right: it is the lesson about traversal order.

One cap artifact, noted rather than fixed: `log` does not return Binary Search, although its deep dive explains the logarithm. The ninety-word prose cap truncates before reaching it. That is the documented trade and the term is genuinely deep-dive-only content here, so it stays.

**2, schema generality. The corrected rule predicted this lesson right.** The rule written at five lessons says a lesson needs primitive work when it puts a new thing on the screen. Binary Search puts a shrinking range on the screen, so it needed work, and it did: `narrow`, because `slide` refuses to change a window's width, and an optional second pointer on `comparison`, because it could only weigh a pair's sum. Both shipped in #24 before any content was written against them.

The ticket had named only the comparison change. The window gap was found by reading the code rather than the ticket, which is the argument for checking the vocabulary against the lesson before starting, not during.

**5, aggregates.** Correct at six with no defects: "6 of 15 lessons published so far, 24 minutes of reading in DSA" on Home, matching figures on the path detail, the paths index, the domain page, and "Showing all 6 lessons" on Explore.

**A problem this item will hit in about nine lessons.** The denominator is `INTERVIEW_FOUNDATIONS_TOTAL`, pinned at fifteen, and the DSA curriculum alone is twenty-five. At fifteen published the path will report itself complete and then start reporting more published than exist. It is correct today and will be wrong without any code changing, so it needs a decision before C14, not after.

**3 and 4** were defended by their assertions and needed no changes.

## Reviewed at seven lessons, 2026-08-15

"Stack and Last-In Order" was the sixth growth, and it repeated the finding from six almost exactly.

**1, ranking. The same defect as last time, in a different word.** Searching `recursion` returned nothing, although a section of the lesson's deep dive is about recursion depth and its limitations name it. Only the title, objective, recognition signals, and a ninety-word slice of prose are indexed, and "recursion" appeared in none of them.

Fixed by adding a recognition signal that uses the word: "Recursion or nested calls leave several pieces of work pending at once, each waiting on a deeper one." That is a real signal rather than keyword stuffing, and `recursion` now returns the lesson.

**This is now a pattern rather than an incident.** Two lessons running, the review caught a central term that the lesson never used in an indexed field. The check to run when authoring is: list the three or four words a learner would actually type for this lesson, and confirm each one is in the title, the objective, or a recognition signal. Prose is not enough, because the cap truncates it.

Still returning nothing, and left alone deliberately: `trace` and `depth`. Both are body terms of one application and one deep-dive section rather than words for the lesson as a whole.

`order` now returns this lesson first, ahead of Two Pointers, on a title match against "Last-In Order". That is correct.

**2, schema generality. The corrected rule predicted this lesson right, and a real limit surfaced beside it.** A stack is a new thing on the screen, so it needed a new primitive, which #26 built.

The limit is that **`array` holds numbers only**. The obvious subject for this lesson is bracket matching, and a string of brackets cannot be shown, because there is no primitive for a sequence of characters. The lesson became nested work instead, which is a better fit for the ticket's own wording, so nothing was lost here. It will be lost eventually: any lesson whose subject is text, and there are several later in the curriculum, has no way to show its input. Worth deciding before it blocks one rather than during.

**5, aggregates.** Correct at seven: "7 of 15 lessons published so far, 28 minutes of reading in DSA", matching figures elsewhere, "Showing all 7 lessons" on Explore.

The denominator problem recorded at six is now eight lessons away rather than nine.

**3 and 4** were defended by their assertions and needed no changes.

## Reviewed at eight lessons, 2026-08-15

"Queue and First-In Order" was the seventh growth, and the first where the review found no ranking defect. That is the finding.

**1, ranking. Clean, because the check moved before publication.** The last two reviews each caught a central term missing from every indexed field, after the lesson was written. This time the words a learner would type were listed first and checked against the title, objective, and recognition signals while authoring: `queue`, `fifo`, `fair`, `waiting`, `backlog`, `arrival`. All six resolve to this lesson, and `fifo` only does because the acronym was put into a recognition signal deliberately rather than left to prose.

The check works. It belongs in the authoring routine rather than in this document as an observation.

Two words still return nothing, and both are left alone on purpose. `starvation` and `buffer` are deep-dive concepts rather than names for the lesson, and the ninety-word prose cap truncates before reaching them. That is the same trade recorded for `log` and `trace`.

`waiting` returns the Stack lesson first, then this one. Both match on a recognition signal, so the tie breaks on reading order and the earlier lesson wins. Both genuinely match; nothing to fix.

**2, schema generality. Nothing new was needed, and that is the first time a new primitive has been used without one.** C07 part one built the queue against the same contract the stack uses, and the lesson compiled against it without a single schema change. The two structures needed one primitive each and no adjustments to anything shared, which is the first real evidence that the primitive contract generalizes rather than being stretched per lesson.

The rule corrected at five lessons has now predicted four in a row.

**5, aggregates.** Correct at eight: "8 of 15 lessons published so far, 32 minutes of reading in DSA", matching figures on the path detail and domain page, "Showing all 8 lessons" on Explore.

**The denominator problem is now seven lessons away.** At fifteen published the path reports itself complete and then reports more published than exist. Nothing breaks; it starts lying. It needs a decision before C14.

**3 and 4** were defended by their assertions and needed no changes.

## Reviewed at nine lessons, 2026-08-15

"Sorting as a Precondition" was the eighth growth. It found more than any review since the second.

**1, ranking. A defect, and it runs in the opposite direction from the previous ones.** Searching `pair` returned this new lesson **above Two Pointers**, which is the lesson actually about finding a pair.

The cause was not the new lesson. Its recognition signal legitimately says "duplicates, closest pairs, and grouping all become adjacent once ordered", which scores as a signal match. Two Pointers had "pair" only in its objective, scoring lower, because its recognition signals never say what the technique finds: they describe ordering and comparison in the abstract. Fixed by adding "The question asks for a pair of positions, and checking every pair would be too slow" to Two Pointers, and `pair` now returns it first.

**The authoring check has to run in both directions.** Until now it was "does my lesson own the words a learner would type for it". This adds: "does my lesson accidentally outrank an older one on a word that belongs to that older lesson". A new lesson can demote an existing one without either being wrong, and only a search across the real index shows it.

Left alone deliberately: `stable` and `stability` return nothing, although the deep dive has a section on stability. Same trade as `log`, `trace`, and `starvation`, all deep-dive concepts rather than names for a lesson. `sorted` returns Binary Search first and this lesson second, both on signal matches with the tie broken by reading order; both genuinely match.

**2, schema generality. No primitive work, exactly as the ticket said, but the audit found a larger gap while confirming it.**

**No action can change an array's values.** Arrays are immutable once authored: every action moves a pointer, changes a window range, mutates stack, queue, or bucket entries, sets highlights, or sets a result status. Nothing reorders or rewrites an array.

This lesson is unaffected because its subject is the precondition rather than the algorithm, so it uses two arrays, before and after, and highlights. That was a design choice made once the gap was known, not a workaround discovered late.

It will block later lessons. **C17 Heap** must show values moving into place, **C20 and C21 dynamic programming** must show a table being filled, and any lesson that wants to animate a sort needs the same thing. All three need an action that writes to an array, most likely a `swap` for the first and a `set-value` for the others. Deciding that before C17 rather than during it is the lesson C05 already taught.

**5, aggregates.** Correct at nine: "9 of 15 lessons published so far, 36 minutes of reading in DSA", with matching figures elsewhere. **The denominator problem is now six lessons away.**

**7 recurred, and a normal test caught it rather than a tripwire.** `tests/e2e/explore.spec.ts` asserted that searching "pair" returns exactly one lesson. That is catalog size in disguise, and it broke the moment a second lesson legitimately mentioned pairs. Rewritten to assert that the query reached Explore, narrowed the list, and kept the lesson the term names, with no fixed count. This is the third time item 7 has been recorded; the difference now is that the failure arrived through the ordinary suite, which is the system working.

**3 and 4** were defended by their assertions and needed no changes.

## Reviewed at ten lessons, 2026-08-15

"Dynamic Sliding Window" was the ninth growth, and the first lesson graded anything other than `easy`. That single fact fired an assertion that had been vacuous for nine lessons.

**3, displayed position. The assertion fired for real, and it needed a decision rather than a fix.** The domain page does not render one list. It groups lessons under a heading per difficulty, and each group is its own ordered list. Every lesson until now was `easy`, so there was one group and the page happened to read as a single list numbered 1 to 9. The tenth lesson opened a second group, which started again at 01, and the assertion caught it.

**The decision: each list ordinates itself.** The rule this item defends is that a list has no arbitrary gaps, and a restart under a new heading is not a gap. Numbering the medium group from ten would produce a list whose first item is 10, which reads worse than the restart does. The assertion now checks positions per list rather than across the page, and the page-wide reading is recorded as an accident of every lesson having shared one difficulty.

This is the first time one of the two assertions has fired on a real change rather than being vacuously satisfied. It behaved exactly as designed: it could not be silenced without deciding what a reader should see.

**1, ranking. One defect, found by the pre-authoring check rather than after the fact.** `grow` and `shrink` returned nothing for this lesson, although growing and shrinking is literally how its own ticket describes it. Its recognition signal said "extending" and "shortening". Reworded to "Growing the stretch can only break the condition, and shrinking it from the front can only help", which keeps the monotonic meaning and uses the words a learner types. `shrink` now returns this lesson first.

Left alone: `longest` returns the Queue lesson first and this one second. Both match on a recognition signal, and the tie breaks on reading order. Both genuinely use the word, and contorting either to win the query would be worse than the tie.

**2, schema generality. A prediction made at C04 paid off five lessons later.** C04 built the window as a **range** rather than a start and a width, explicitly so that a lesson needing a changing width could extend the shape instead of replacing it. This lesson is that case, and the primitive needed no change at all: only a third action, `advance`, and no renderer work, because a window already draws any range.

The window now carries three actions whose differing refusals are the design: `slide` refuses to change the width, `narrow` refuses to escape the current range, `advance` refuses to move either edge backward. Each refusal is the claim of the lesson that uses it.

**5, aggregates.** Correct at ten: "10 of 15 lessons published so far, 41 minutes of reading in DSA". This is the first lesson with a duration other than four minutes, so the total is the first that is not a simple multiple, and it adds up.

**The denominator problem is now five lessons away** and still needs a decision before C14.

**7 recurred a fourth time.** `tests/e2e/domains.spec.ts` asserted that the difficulty headings were exactly `["difficulty-easy"]`. That is catalog composition in disguise, and it broke on the first lesson graded otherwise. Rewritten to assert every group is a known difficulty and the groups run in graded order, which is what the test's own comment says it cares about.

Two tests in two reviews have now encoded catalog composition rather than catalog size. The general form of item 7 is wider than first written: **an assertion about what the catalog contains, not only how much it contains, rots as content lands.**

## Why this exists as tests rather than a note

Earlier notes about this project went stale without anyone noticing: a roadmap whose checkboxes lagged reality by two milestones, a handoff describing an administrator bypass that never existed, and design documents describing a feature deleted the day before. Each was prose, and prose does not fail.

The tripwires are tests so that the pull request adding a second lesson cannot merge without confronting them.
