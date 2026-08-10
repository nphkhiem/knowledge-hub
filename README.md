# Knowledge Hub

Knowledge Hub is a visual learning library for software developers. Each lesson takes one technical concept and gives you a usable mental model of it in a few minutes, starting with a short animation and then going deeper only if you want it to.

It is written for developers who recognize a term, "two pointers", "cache-aside", "backpressure", but do not yet have a picture in their head of how it works or when to reach for it. That includes people preparing for demanding interviews, though the aim is understanding that stays with you afterwards rather than answers you memorize for a week.

## The idea

Most explanations of a technical concept are either a wall of prose or a code snippet with no picture. Both can leave you able to repeat a definition without being able to spot the pattern in your own work.

Every lesson here follows one rule: immediate insight, optional depth. You should get the core idea from the visual alone. If you want more, the page keeps going. If you do not, you can leave after a minute and still have gained something real.

Lessons are always laid out in the same order, so you learn the shape once:

1. A short looping animation showing the concept work from its starting point to a result.
2. A numbered, static **step by step** version of the same sequence.
3. **Quick Understanding**: how to recognize the pattern, when it fits, and one honest limitation.
4. An optional **Deep Dive** for implementation detail, including the concept written out in Python, TypeScript, Java, C++, and Go.
5. **Real-World Applications**: concrete situations from actual software work, not restated toy examples.

The animation is never the only route to the information. The step by step version carries the same meaning without motion, and a written description carries it to screen readers. All three are generated from the same lesson file, so they cannot drift apart.

Every lesson also records the sources behind it, with the date they were checked, and validation refuses to build a lesson that has none. That record is held in the lesson source rather than printed on the page.

## Project status

Pre-release, and worth being blunt about: there is no public website yet, and the first lesson is not finished.

What works today:

- A lesson format built from plain YAML and Markdown, validated at build time so a broken lesson cannot ship.
- A compiler that turns a lesson directory into a fixed, normalized sequence of semantic states.
- A deterministic playback engine with no dependency on a browser.
- A renderer that turns any state into semantic SVG, static markup, and a plain text description.
- A static site with a working lesson route: the looping animation, the static step sequence, the reading sections, and code samples in five languages.
- 278 unit tests, executable examples in five languages, and 24 browser tests covering the journey, reduced motion, accessibility, and performance budgets. One command runs all of it.

What is not here yet:

- Only one lesson exists. Fourteen more are planned for the first collection.
- No search, no browsing, and no learning path pages.
- Deployment is newly wired, so the published site is only just appearing.

If you arrived expecting something finished, this is not it yet.

## What is being built first

The first collection is **Interview Foundations**: fifteen lessons covering seven data structure and algorithm patterns, two networking fundamentals, and six introductory system design topics.

It is ordered as a recommended path, but nothing is locked. Every lesson has its own address and stands on its own, so you can open or share exactly the one you need. Git and mobile development collections are planned, but they are not part of the first release.

## How it works

A lesson is data, not code. You write what happens, and the project owns how it is drawn.

Each lesson directory holds a `lesson.yaml` describing the objects on screen and an ordered timeline of what happens to them, alongside Markdown files for the reading sections. That YAML is plain data with no expressions, no includes, and no embedded HTML, which is what makes it safe to accept from a contributor and possible to validate strictly.

At build time the lesson is checked, then compiled into a sequence of semantic states. Everything the learner sees is generated from that sequence: the animation, the static step list, and the screen reader description. New visual behavior is added as a reviewed, tested primitive rather than as one lesson's special case.

| Path | What lives there |
| --- | --- |
| `lessons/` | Lesson content, one directory per lesson. |
| `packages/lesson-schema` | The lesson format and its validation rules. |
| `packages/lesson-compiler` | Turns a lesson directory into validated, normalized states. |
| `packages/lesson-engine` | Pure playback logic. No DOM, no timers, no storage. |
| `packages/lesson-renderer` | Turns one state into SVG, static markup, and a description. |
| `packages/lesson-testing` | Shared fixtures and the suite every visual primitive must pass. |
| `apps/site` | The static site: routing, layout, and page composition. |

There are no accounts and no backend, and the site remembers nothing about you: no progress, no bookmarks, no analytics. Lessons are public and every page is the same for everyone.

## Accessibility

This is treated as a release requirement, not a cleanup pass at the end. The rules the project holds itself to:

- WCAG 2.2 AA is the target.
- Nothing carries meaning by color alone, or by motion, position, or hover alone.
- Every animation has a static, numbered equivalent that teaches the same thing.
- Animations honor `prefers-reduced-motion`. When it is set, motion does not start and the step sequence takes its place.
- Any animation can be stopped from the keyboard, and screen readers get one written description rather than a stream of repeated announcements.
- No lesson requires audio.

## Running it locally

You need Node 22.20.0 or newer and pnpm 11.20.0.

```bash
pnpm install
pnpm --filter @knowledge-hub/site dev
```

The lesson route is `/lessons/dsa/two-pointers/`.

Other commands worth knowing:

```bash
pnpm test     # unit and integration tests
pnpm check    # formatting, linting, spelling, and type checking
pnpm build    # production build of the static site
pnpm verify   # all of the above in one run
```

## Contributing

Contributions are not open yet. The project is still changing shape too quickly for that to be a fair use of anyone's time.

When it does open, the model will be that lessons are proposed as issues and pull requests, a maintainer reviews them for technical accuracy and teaching quality, and every published lesson carries an Evidence Record built from primary sources. A well written blog post is not enough on its own to support a claim. An authoring guide will land before contributions open.

Factual corrections, accessibility problems, and bugs are welcome now. [CONTRIBUTING.md](CONTRIBUTING.md) says what helps, and the [Code of Conduct](CODE_OF_CONDUCT.md) and [security policy](SECURITY.md) cover the rest.

## Licensing

The plan is to dual license: Apache-2.0 for the software, tooling, and tests, and CC BY 4.0 for the educational content, meaning lesson text, narration, questions, and original diagrams.

The path by path mapping and the full license texts are in [LICENSE.md](LICENSE.md) and [`LICENSES/`](LICENSES/). Fonts and build dependencies are attributed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
