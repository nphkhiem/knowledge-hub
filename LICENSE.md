# Licensing

Knowledge Hub is dual licensed, because it contains two different kinds of work
and one license does not serve both well.

- **Software** is licensed under **Apache-2.0**. Full text in
  [`LICENSES/Apache-2.0.txt`](LICENSES/Apache-2.0.txt).
- **Educational content** is licensed under **CC BY 4.0**. Full text in
  [`LICENSES/CC-BY-4.0.txt`](LICENSES/CC-BY-4.0.txt).

## Which license applies to which path

| Path | License | What it covers |
| --- | --- | --- |
| `apps/` | Apache-2.0 | The static site: routing, layout, components, client controllers. |
| `packages/` | Apache-2.0 | The schema, compiler, engine, renderer, and shared test kit. |
| `tests/` | Apache-2.0 | End to end, accessibility, and performance suites. |
| `scripts/` | Apache-2.0 | Repository tooling. |
| Root configuration files | Apache-2.0 | Build, lint, format, type, and test configuration. |
| `lessons/**/*.yaml` | CC BY 4.0 | Lesson definitions: scene, timeline, narration, questions, evidence. |
| `lessons/**/*.md` | CC BY 4.0 | Lesson prose. |
| `lessons/**/examples/**` | Apache-2.0 | Executable code samples and their tests. |
| `docs/` | CC BY 4.0 | Project documentation prose. |
| `README.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md` | CC BY 4.0 | Project documentation prose. |

`lessons/**/examples/**` is deliberately Apache-2.0 rather than CC BY 4.0. Those
files are runnable programs that a reader may reasonably want to copy into their
own work, and an attribution requirement on a twenty line function would be an
unhelpful trap.

## Attribution

When you reuse educational content under CC BY 4.0, credit "Knowledge Hub" and
link to the lesson you drew from. You do not need to credit anyone to use the
software under Apache-2.0, though the license's notice requirements still apply.

## Contributions

Contributions are licensed under the license that governs the path they land in,
as mapped above. There is no separate contributor licence agreement. By opening a
pull request you agree that your contribution may be published under that
license.

## Machine readable identifiers

The SPDX identifiers for this repository are `Apache-2.0` and `CC-BY-4.0`. A
combined expression for the repository as a whole is:

```
Apache-2.0 AND CC-BY-4.0
```

## Third party material

Self hosted fonts are distributed under the SIL Open Font License by their
respective authors and are not covered by the licenses above. Dependency
licenses are recorded in `pnpm-lock.yaml` and in each dependency's own
distribution. A consolidated third party notice file is planned before the first
public release.
