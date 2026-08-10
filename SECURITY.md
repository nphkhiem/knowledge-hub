# Security policy

## What this project is

Knowledge Hub is a static site. It has no backend, no database, no accounts, and
no user data. Nothing is collected, stored, or transmitted about a reader. That
removes whole categories of risk, and it should shape what you expect here.

The realistic attack surface is:

- **Lesson content becoming executable.** Lesson YAML is a restricted JSON
  compatible subset and lesson Markdown is sanitized during compilation. A way to
  get script execution out of lesson source would be a genuine finding.
- **Injection through generated markup.** The renderer escapes every author
  controlled value before serializing SVG and HTML. An escape that can be broken
  out of would be a genuine finding.
- **The embedded lesson data block.** Compiled lesson JSON is embedded in the
  page and escaped so it cannot close its own element. A bypass would be a
  genuine finding.
- **Supply chain.** A compromised dependency reaching the built output.

## Reporting a vulnerability

Please report privately, not in a public issue.

Use GitHub's private reporting:
<https://github.com/nphkhiem/knowledge-hub/security/advisories/new>

If that is not available to you, email nphkhiem@gmail.com.

Please include what you did, what happened, and why you believe it is a security
problem rather than a bug. A proof of concept helps, even a rough one.

## What to expect

This is a single maintainer project, so please calibrate accordingly:

- An acknowledgement within seven days.
- An assessment of whether it is a security issue within fourteen days.
- A fix timeline once assessed, communicated honestly, including "this will take
  a while" when that is true.

There is no bug bounty. Credit in the fix's release notes is offered if you want
it.

## Supported versions

Only the currently deployed site and the current `main` branch are supported.
There are no released versions, no long term support branches, and no backports.

## Out of scope

- Findings that require a compromised machine or a malicious browser extension.
- Missing hardening headers with no demonstrated impact on a site that holds no
  user data.
- Automated scanner output submitted without a working proof of concept.
- Denial of service against a static site.
