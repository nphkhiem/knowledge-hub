# Contributing

## Where things stand

**Lesson contributions are not open yet.** The lesson format is still settling,
and inviting people to write against a moving target would waste their time. An
authoring guide will land before that opens.

What is genuinely useful right now:

- **Factual corrections.** If a lesson states something wrong, or its evidence
  does not support the claim it is attached to, that is the most valuable issue
  you can open. Please quote the sentence and cite a primary source.
- **Accessibility problems.** If something is unreachable by keyboard, unclear
  in a screen reader, or fails under reduced motion, please say what you used and
  what happened.
- **Bugs.** Anything that renders wrong, breaks without JavaScript, or throws.

## Running the project

You need Node 22.20.0 or newer, pnpm 11.20.0, and Python 3.11 for the example
tests. Java, C++, and Go toolchains are needed only if you touch the samples in
those languages.

```bash
pnpm install
pnpm --filter @knowledge-hub/site dev
```

Before opening a pull request:

```bash
pnpm verify
```

That runs formatting, linting, spell checking, type checking, unit tests, the
executable examples in all five languages, the production build, and the browser
suite. It must pass with no warnings. Browser tests need Chromium once:

```bash
pnpm exec playwright install chromium
```

## How the code is organized

Data flows one way, and each step is a package:

```
lessons/*.yaml -> lesson-schema -> lesson-compiler -> lesson-engine -> lesson-renderer -> apps/site
```

A lesson is data, never code. Lesson YAML is a restricted JSON compatible subset
with no expressions, includes, or embedded markup, which is what makes it safe to
accept from a contributor and possible to validate strictly.

Testing conventions are documented in
[`docs/testing-conventions.md`](docs/testing-conventions.md). Read it before
writing tests; the house style is deliberate and the reasons are given.

## Branches and commits

Branch off `main` with a typed, short lived branch:

```
feat/short-description
fix/short-description
docs/short-description
refactor/short-description
```

Commit subjects use Conventional Commits, lowercase and imperative, with no
trailing period:

```
feat: render accessible lesson snapshots
fix: recover from invalid runtime engine states
docs: record the repository testing conventions
```

Do not add co-author trailers or generated-by footers.

## Pull requests

Titles are imperative sentence case. The body follows the template, which asks
for a summary, the changes, test-first evidence, verification you actually ran,
screenshots for anything visible, and known gaps.

Be honest in the verification section. "I ran `pnpm verify` and it passed" is
useful. Saying it passed when it was not run is worse than saying nothing.

`main` requires a pull request. Merges are squash only and the branch is deleted
automatically.

Every pull request runs six independently named checks, so a failure tells you
which gate broke rather than reporting one opaque red cross:

| Check | What it proves |
| --- | --- |
| `quality` | Formatting, linting at zero warnings, spelling, and types. |
| `tests` | Unit and integration tests, plus the executable examples in every published language. |
| `experience` | The journey, reduced motion, and accessibility suites in a real browser. |
| `build` | The production build succeeds and every expected route was generated. |
| `performance` | Paint, layout stability, interaction latency, and payload budgets. |
| `security` | Known vulnerabilities in shipped dependencies, and that no private or generated file is tracked. |

`pnpm verify` runs the same commands locally, so a green run before you push
usually means a green run on the pull request.

Nothing deploys from a pull request. A squash merge to `main` builds the site,
publishes it to GitHub Pages, and then smoke tests the published URL.

One local wrinkle: on macOS `astro preview` puts itself in the background, so the
first browser test run after stopping the preview server can fail with
"Process from config.webServer exited early". Run it again and it will reuse the
server that the first attempt left behind. On Linux, including CI, the server
stays in the foreground and this does not happen.

## Quality bar for a lesson

Every published lesson must satisfy all of the following. This is the checklist a
maintainer reviews against.

- **One mental model.** The lesson teaches a single idea, understandable in three
  to five minutes.
- **Recognition, fit, and a limitation.** The reader can tell when the pattern
  applies and when it does not. The limitation is real, not a disclaimer.
- **Real applications.** One to three concrete situations from actual software
  work, each naming why the concept fits and a production constraint that still
  bites. Toy restatements do not count.
- **Evidence.** Every factual claim traces to a primary source, recorded with the
  date it was checked. A blog post is not sufficient support on its own.
- **Accessibility.** Meaning never depends on color, motion, position, or hover
  alone. Every animation has a static equivalent carrying the same information.
  Everything is keyboard operable with a visible focus indicator.
- **Tested examples.** Any code sample runs in the test suite. A sample that is
  not executed does not ship.
- **No invented behavior.** New visual behavior arrives as a reviewed, tested
  primitive, not as a special case buried in one lesson.

## Code of conduct

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## Licensing

Contributions are licensed under the license that governs the path they land in.
See [LICENSE.md](LICENSE.md). There is no contributor licence agreement.
