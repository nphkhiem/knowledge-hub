# Testing conventions

How tests are written in this repository. These are not suggestions: the existing suite follows them consistently, and new code is expected to match. If you are adding a lesson, a primitive, or a package, copy the nearest existing test rather than inventing a style.

## Where tests live and how they run

Vitest runs two projects, configured in `vitest.config.ts`:

| Project | Environment | Matches |
| --- | --- | --- |
| `node` | node | `packages/**/*.test.ts`, `lessons/**/*.test.ts` |
| `site` | jsdom | `apps/site/src/**/*.test.ts` |

Tests sit next to the code they cover, named `<subject>.test.ts`. Property-based tests are named `<subject>.property.test.ts`. Fixtures that are not code live in a `test-fixtures/` directory at the package root, outside `src/` and outside the TypeScript `include`.

Commands:

```bash
pnpm test     # both projects
pnpm check    # formatting, linting, spelling, type checking
pnpm verify   # check, then test, then the production build
```

Lint runs with `--max-warnings 0`, so a warning fails the build. Test files are held to the same TypeScript strictness as production code, including `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`.

## Assert once, with the whole picture

Build one object containing every fact under test and compare it with a single `expect(...).toEqual(...)`.

```ts
expect({
  escaped: markup.includes("&lt;script&gt;"),
  raw: markup.includes("<script>"),
}).toEqual({ escaped: true, raw: false });
```

The reason is diagnostic quality. A sequence of single-value assertions stops at the first failure and hides the rest, so you fix one thing, rerun, and discover the next. One aggregate assertion reports every deviation at once.

The corollary matters just as much: **never collapse a check to a bare boolean.** `expect(items.every(isValid)).toBe(true)` fails with `false !== true` and tells you nothing about which item was wrong. Return the offending value instead:

```ts
expect(findOutOfBoundsCoordinates(markup, 960, 420)).toEqual([]);
```

A failure then names the coordinate, the element, and the limit it broke.

## Property tests carry a fixed seed

Property tests use `@fast-check/vitest` and always pass an explicit literal seed, so a failure reproduces exactly instead of appearing once and vanishing.

```ts
test.prop([commandSequenceArbitrary], { seed: 40_304_002 })(
  "replays arbitrary command sequences deterministically",
  (commands) => { /* ... */ },
);
```

Seeds currently in use are in the `40_304_0xx` range. Pick a new distinct value rather than reusing one.

Property tests are for invariants that must hold across all inputs: determinism, immutability of inputs, staying inside a range, boundary commands returning the state unchanged. Use example tests for specific behavior with specific expected output.

## Fixtures come from the shared kit

`@knowledge-hub/lesson-testing` exports the real compiled Two Pointers lesson and the validated source it came from. Use them.

```ts
import { compiledTwoPointersLesson } from "@knowledge-hub/lesson-testing";
```

Do not hand-roll a parallel compiled lesson in a test file. A hand-built fixture drifts from what the compiler actually produces, which means the test passes while the product is broken. Fixtures are deeply frozen at module load, so a test that mutates one fails loudly instead of leaking state into its neighbors.

Constructing a synthetic snapshot from real ones is fine and sometimes necessary, for example when no single step of a lesson exercises every primitive at once. Say why in a comment.

## Every primitive passes the same contract

A visual primitive is not finished until it satisfies `runPrimitiveConformance`. The contract checks six behaviors: it accepts only its own scene objects, renders an interactive group carrying an object hook, renders a static step without one, produces a plain-text semantic description, stays inside the logical viewBox at a narrow width, and never emits raw author-controlled text.

Call it once per primitive from that primitive's test file. This is the main mechanism that keeps the catalog consistent as it grows, so extend the contract rather than writing bespoke assertions per primitive.

## Untrusted input is cast through a named helper

When a test deliberately feeds a value the type system forbids, do it through a named local function rather than an inline `as`.

```ts
function probeEngineCommand(value: unknown): EngineCommand {
  return value as EngineCommand;
}
```

The intent is then legible, and every deliberate hole in the type system is easy to find and audit.

## Prove the test can fail

A test written after the code it covers has not been shown to work. Either write it first and watch it fail for the right reason, or break the production line it covers, confirm the failure, and restore it. A weak red, such as a module that does not exist yet, only proves the import resolves; it does not prove the assertion bites.

## Two traps this repository has already hit

**Node's `URL` under jsdom.** In the `site` project the global `URL` resolves relative paths against the jsdom document base, producing an `http:` URL that `fileURLToPath` rejects. Import Node's implementation explicitly:

```ts
import { URL as NodeURL, fileURLToPath } from "node:url";
```

**Astro components cannot be unit tested here.** Astro 7.2 does not wire its compiler into Vitest 4, whether its config helper is used standalone or through the root project list. An imported `.astro` module resolves to a plain function with `isAstroComponentFactory` undefined, and the container API fails with `NoMatchingRenderer`. Do not spend time on this. Keep `.astro` files as thin templates with no logic worth testing, put anything conditional into a plain TypeScript module beside them where the `site` project can reach it, and verify the rendered page at the browser level instead.

## What tests here do not cover

Two things, named so they are not mistaken for oversights.

Whether a lesson teaches. No assertion proves a reader forms a durable mental model, so that stays a human editorial review.

Whether a figure looks right. Visual regression detects change, not correctness, so a first baseline always has to be judged by eye.
