import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { expect, test } from "vitest";
import { compileLessonPackage, LessonPackageError } from "./index.js";

const invalidFixtures = fileURLToPath(
  new URL("../test-fixtures/invalid/", import.meta.url),
);
const canonicalLesson = fileURLToPath(
  new URL("../../../lessons/dsa/two-pointers/", import.meta.url),
);

async function cloneCanonicalLesson(): Promise<string> {
  const temporaryRoot = await mkdtemp(
    join(tmpdir(), "knowledge-hub-compiler-"),
  );
  const directory = join(temporaryRoot, "dsa", "two-pointers");
  await mkdir(join(temporaryRoot, "dsa"), { recursive: true });
  await cp(canonicalLesson, directory, { recursive: true });
  return directory;
}

test("requires package directories to match the lesson domain and slug", async () => {
  const directory = await cloneCanonicalLesson();
  const mismatchedDirectory = join(directory, "..", "wrong-slug");

  try {
    await cp(directory, mismatchedDirectory, { recursive: true });
    const compilation = compileLessonPackage(mismatchedDirectory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "identity.directory-mismatch",
          file: join(mismatchedDirectory, "lesson.yaml"),
          path: "slug",
          message:
            'Lesson slug "two-pointers" must match package directory "wrong-slug".',
        },
      ],
    });
  } finally {
    await rm(join(directory, "..", ".."), { force: true, recursive: true });
  }
});

test("rejects a lesson id that differs from its canonical domain and slug", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await applyInvalidFixture(directory, "identity/mismatched-id.json");
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "identity.mismatch",
          file: lessonFile,
          path: "id",
          message: 'Lesson id must equal "dsa.two-pointers".',
        },
      ],
    });
  } finally {
    await rm(join(directory, "..", ".."), { force: true, recursive: true });
  }
});

async function replaceInLessonYaml(
  directory: string,
  before: string,
  after: string,
): Promise<void> {
  const file = join(directory, "lesson.yaml");
  const source = await readFile(file, "utf8");
  if (!source.includes(before)) {
    throw new Error(`Expected lesson fixture text was not found: ${before}`);
  }
  await writeFile(file, source.replace(before, after), "utf8");
}

interface InvalidFixture {
  readonly remove?: readonly string[];
  readonly replacements: readonly {
    readonly before: string;
    readonly after: string;
  }[];
}

async function applyInvalidFixture(
  directory: string,
  fixture: string,
): Promise<void> {
  const descriptor = JSON.parse(
    await readFile(join(invalidFixtures, fixture), "utf8"),
  ) as InvalidFixture;
  for (const { after, before } of descriptor.replacements) {
    await replaceInLessonYaml(directory, before, after);
  }
  await Promise.all(
    (descriptor.remove ?? []).map((filename) => rm(join(directory, filename))),
  );
}

function validApplication(title: string): string {
  return [
    `## ${title}`,
    "",
    "### Situation",
    "",
    "A concrete production situation.",
    "",
    "### Why it fits",
    "",
    "The invariant makes the pattern appropriate.",
    "",
    "### Application",
    "",
    "The developer applies the coordinated scan.",
    "",
    "### Constraint",
    "",
    "Ordering and mutation constraints still matter.",
  ].join("\n");
}

test("rejects custom YAML tags with a stable diagnostic", async () => {
  const compilation = compileLessonPackage(`${invalidFixtures}/custom-tag`);

  await expect(compilation).rejects.toBeInstanceOf(LessonPackageError);
  await expect(compilation).rejects.toMatchObject({
    diagnostics: expect.arrayContaining([
      {
        code: "yaml.tag",
        file: join(invalidFixtures, "custom-tag", "lesson.yaml"),
        path: "$",
        message: "Explicit YAML tags are not allowed.",
      },
    ]),
  });
});

test("rejects YAML aliases with a stable diagnostic", async () => {
  const directory = join(invalidFixtures, "alias");
  const compilation = compileLessonPackage(directory);

  await expect(compilation).rejects.toMatchObject({
    diagnostics: [
      {
        code: "yaml.alias",
        file: join(directory, "lesson.yaml"),
        path: "$",
        message: "YAML aliases and anchors are not allowed.",
      },
    ],
  });
});

test("rejects YAML merge pairs with a stable diagnostic", async () => {
  const directory = join(invalidFixtures, "merge");
  const compilation = compileLessonPackage(directory);

  await expect(compilation).rejects.toMatchObject({
    diagnostics: [
      {
        code: "yaml.merge",
        file: join(directory, "lesson.yaml"),
        path: "$",
        message: "YAML merge pairs are not allowed.",
      },
    ],
  });
});

test("rejects duplicate YAML keys with a stable diagnostic", async () => {
  const directory = join(invalidFixtures, "duplicate-key");
  const compilation = compileLessonPackage(directory);

  await expect(compilation).rejects.toMatchObject({
    diagnostics: [
      {
        code: "yaml.duplicate-key",
        file: join(directory, "lesson.yaml"),
        path: "$",
        message: "YAML keys must be unique.",
      },
    ],
  });
});

test("rejects multiple YAML documents with a stable diagnostic", async () => {
  const directory = join(invalidFixtures, "multiple-documents");
  const compilation = compileLessonPackage(directory);

  await expect(compilation).rejects.toMatchObject({
    diagnostics: [
      {
        code: "yaml.multiple-documents",
        file: join(directory, "lesson.yaml"),
        path: "$",
        message: "A lesson source must contain exactly one YAML document.",
      },
    ],
  });
});

test("rejects YAML directives with a stable diagnostic", async () => {
  const directory = join(invalidFixtures, "directive");
  const compilation = compileLessonPackage(directory);

  await expect(compilation).rejects.toMatchObject({
    diagnostics: [
      {
        code: "yaml.directive",
        file: join(directory, "lesson.yaml"),
        path: "$",
        message: "YAML directives are not allowed.",
      },
    ],
  });
});

test("rejects an unused YAML tag directive", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await writeFile(
      lessonFile,
      "%TAG !lesson! tag:example.com,2026:\n---\nschemaVersion: 1\n",
      "utf8",
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "yaml.directive",
          file: lessonFile,
          path: "$",
          message: "YAML directives are not allowed.",
        },
      ]),
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects an explicit YAML directive that redefines the core tag handle", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await writeFile(
      lessonFile,
      "%TAG !! tag:evil.example,2026:\n---\nschemaVersion: 1\n",
      "utf8",
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "yaml.directive",
          file: lessonFile,
          path: "$",
          message: "YAML directives are not allowed.",
        },
      ]),
    });
  } finally {
    await rm(join(directory, "..", ".."), { force: true, recursive: true });
  }
});

test("rejects YAML parser errors without leaking parser prose", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await writeFile(lessonFile, "schemaVersion: [1\n", "utf8");
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "yaml.syntax",
          file: lessonFile,
          path: "$",
          message: "The YAML document is malformed.",
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("accepts quoted text together with plain JSON scalar values", async () => {
  const lesson = await compileLessonPackage(canonicalLesson);

  expect(lesson).toMatchObject({
    schemaVersion: 1,
    title: "Two Pointers",
    durationMinutes: 4,
    timeline: expect.arrayContaining([
      expect.objectContaining({ terminal: true }),
    ]),
  });
});

test("rejects an unquoted plain text scalar with a stable diagnostic", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await replaceInLessonYaml(
      directory,
      'title: "Two Pointers"',
      "title: Two Pointers",
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "yaml.plain-string",
          file: lessonFile,
          path: "$",
          message: "String values must be quoted in lesson YAML.",
        },
      ]),
    });
  } finally {
    await rm(join(directory, "..", ".."), { force: true, recursive: true });
  }
});

test("rejects YAML parser warnings without leaking parser prose", async () => {
  const directory = join(invalidFixtures, "parser-warning");
  const compilation = compileLessonPackage(directory);

  await expect(compilation).rejects.toMatchObject({
    diagnostics: expect.arrayContaining([
      {
        code: "yaml.warning",
        file: join(directory, "lesson.yaml"),
        path: "$",
        message: "The YAML parser reported a warning.",
      },
    ]),
  });
});

test("rejects embedded HTML in lesson YAML", async () => {
  const directory = join(invalidFixtures, "embedded-html");
  const compilation = compileLessonPackage(directory);

  await expect(compilation).rejects.toMatchObject({
    diagnostics: [
      {
        code: "yaml.embedded-html",
        file: join(directory, "lesson.yaml"),
        path: "title",
        message: "HTML is not allowed in lesson YAML.",
      },
    ],
  });
});

test("reports a missing lesson source file", async () => {
  const directory = await cloneCanonicalLesson();
  const missingFile = join(directory, "lesson.yaml");

  try {
    await rm(missingFile);
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "file.missing",
          file: missingFile,
          path: "$",
          message: "Required lesson file is missing or unreadable.",
        },
      ],
    });
  } finally {
    await rm(join(directory, "..", ".."), { force: true, recursive: true });
  }
});

test.each([
  ["Quick Understanding", "quick-understanding.md", "quickUnderstanding"],
  [
    "Real-World Applications",
    "real-world-applications.md",
    "realWorldApplications",
  ],
  ["Deep Dive", "deep-dive.md", "deepDive"],
] as const)(
  "attributes a missing %s file to its public field",
  async (_label, filename, field) => {
    const directory = await cloneCanonicalLesson();
    const missingFile = join(directory, filename);

    try {
      await rm(missingFile);
      const compilation = compileLessonPackage(directory);

      await expect(compilation).rejects.toMatchObject({
        diagnostics: expect.arrayContaining([
          {
            code: "file.missing",
            file: missingFile,
            path: `content.${field}`,
            message: "Required lesson file is missing or unreadable.",
          },
        ]),
      });
    } finally {
      await rm(join(directory, "..", ".."), {
        force: true,
        recursive: true,
      });
    }
  },
);

test("aggregates all missing declared content files in stable order", async () => {
  const directory = await cloneCanonicalLesson();

  try {
    await applyInvalidFixture(directory, "missing-files/all-declared.json");
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "file.missing",
          file: join(directory, "deep-dive.md"),
          path: "content.deepDive",
          message: "Required lesson file is missing or unreadable.",
        },
        {
          code: "file.missing",
          file: join(directory, "quick-understanding.md"),
          path: "content.quickUnderstanding",
          message: "Required lesson file is missing or unreadable.",
        },
        {
          code: "file.missing",
          file: join(directory, "real-world-applications.md"),
          path: "content.realWorldApplications",
          message: "Required lesson file is missing or unreadable.",
        },
      ],
    });
  } finally {
    await rm(join(directory, "..", ".."), { force: true, recursive: true });
  }
});

test("requires the exact Quick Understanding heading structure", async () => {
  const directory = await cloneCanonicalLesson();
  const quickUnderstandingFile = join(directory, "quick-understanding.md");

  try {
    await writeFile(
      quickUnderstandingFile,
      "## Overview\n\nUseful prose without the approved sections.\n",
      "utf8",
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "markdown.quick-understanding-structure",
          file: quickUnderstandingFile,
          path: "content.quickUnderstanding",
          message:
            "Quick Understanding requires level-two headings: Recognition signals, When it fits, Limitation.",
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("requires prose in every Quick Understanding section", async () => {
  const directory = await cloneCanonicalLesson();
  const quickUnderstandingFile = join(directory, "quick-understanding.md");

  try {
    await writeFile(
      quickUnderstandingFile,
      [
        "## Recognition signals",
        "",
        "Ordered data.",
        "",
        "## When it fits",
        "",
        "A monotonic comparison.",
        "",
        "## Limitation",
        "",
      ].join("\n"),
      "utf8",
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "markdown.quick-understanding-content",
          file: quickUnderstandingFile,
          path: "content.quickUnderstanding.limitation",
          message: "Each Quick Understanding section requires prose.",
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("requires at least one Real-World Application", async () => {
  const directory = await cloneCanonicalLesson();
  const applicationsFile = join(directory, "real-world-applications.md");

  try {
    await writeFile(applicationsFile, "No application sections.\n", "utf8");
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "markdown.application-count",
          file: applicationsFile,
          path: "content.realWorldApplications",
          message: "A lesson requires one to three Real-World Applications.",
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("allows at most three Real-World Applications", async () => {
  const directory = await cloneCanonicalLesson();
  const applicationsFile = join(directory, "real-world-applications.md");

  try {
    await writeFile(
      applicationsFile,
      ["One", "Two", "Three", "Four"].map(validApplication).join("\n\n"),
      "utf8",
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "markdown.application-count",
          file: applicationsFile,
          path: "content.realWorldApplications",
          message: "A lesson requires one to three Real-World Applications.",
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("requires the exact Real-World Application section structure", async () => {
  const directory = await cloneCanonicalLesson();
  const applicationsFile = join(directory, "real-world-applications.md");

  try {
    await writeFile(
      applicationsFile,
      validApplication("Malformed").replace("### Constraint", "### Caveat"),
      "utf8",
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "markdown.application-structure",
          file: applicationsFile,
          path: "content.realWorldApplications[0]",
          message:
            "Each Real-World Application requires Situation, Why it fits, Application, and Constraint level-three sections.",
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects content before the first Real-World Application", async () => {
  const directory = await cloneCanonicalLesson();
  const applicationsFile = join(directory, "real-world-applications.md");

  try {
    await writeFile(
      applicationsFile,
      `Introductory preamble.\n\n${validApplication("Application")}`,
      "utf8",
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "markdown.application-structure",
          file: applicationsFile,
          path: "content.realWorldApplications",
          message:
            "Real-World Applications content must begin with an application heading.",
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("requires prose in every Real-World Application section", async () => {
  const directory = await cloneCanonicalLesson();
  const applicationsFile = join(directory, "real-world-applications.md");

  try {
    await writeFile(
      applicationsFile,
      validApplication("Missing constraint").replace(
        "Ordering and mutation constraints still matter.",
        "",
      ),
      "utf8",
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "markdown.application-content",
          file: applicationsFile,
          path: "content.realWorldApplications[0].constraint",
          message: "Each Real-World Application section requires prose.",
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("does not split applications at fenced-code heading text", async () => {
  const directory = await cloneCanonicalLesson();
  const applicationsFile = join(directory, "real-world-applications.md");
  const application = validApplication("Queue reconciliation").replace(
    "The developer applies the coordinated scan.",
    [
      "The developer applies the coordinated scan.",
      "",
      "```text",
      "## This is code, not an application",
      "```",
    ].join("\n"),
  );

  try {
    await writeFile(applicationsFile, application, "utf8");
    const lesson = await compileLessonPackage(directory);

    expect(lesson.content.realWorldApplications).toMatchObject([
      {
        id: "queue-reconciliation",
        title: "Queue reconciliation",
      },
    ]);
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects duplicate generated application identifiers", async () => {
  const directory = await cloneCanonicalLesson();
  const applicationsFile = join(directory, "real-world-applications.md");

  try {
    await writeFile(
      applicationsFile,
      [validApplication("Same title"), validApplication("Same title")].join(
        "\n\n",
      ),
      "utf8",
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "markdown.application-id",
          file: applicationsFile,
          path: "content.realWorldApplications[1].id",
          message:
            "Application titles must produce unique, non-empty identifiers.",
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects an empty generated application identifier", async () => {
  const directory = await cloneCanonicalLesson();
  const applicationsFile = join(directory, "real-world-applications.md");

  try {
    await writeFile(applicationsFile, validApplication("!!!"), "utf8");
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "markdown.application-id",
          file: applicationsFile,
          path: "content.realWorldApplications[0].id",
          message:
            "Application titles must produce unique, non-empty identifiers.",
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("requires narration for every timeline step", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await replaceInLessonYaml(
      directory,
      'narration: "Compare 1 and 15. Their sum is 16, which is greater than the target 15."',
      'narration: ""',
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "timeline.narration-required",
          file: lessonFile,
          path: "timeline[0].narration",
          message: "Every timeline step requires narration.",
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects duplicate scene object identifiers", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await replaceInLessonYaml(
      directory,
      'id: "right-pointer"',
      'id: "left-pointer"',
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "identifier.duplicate",
          file: lessonFile,
          path: "scene.objects[2].id",
          message: 'Identifier "left-pointer" is duplicated.',
        },
      ]),
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects duplicate timeline step identifiers", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await replaceInLessonYaml(
      directory,
      'id: "move-right"\n    narration:',
      'id: "compare-ends"\n    narration:',
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "identifier.duplicate",
          file: lessonFile,
          path: "timeline[1].id",
          message: 'Identifier "compare-ends" is duplicated.',
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects duplicate Model Check option identifiers", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await replaceInLessonYaml(
      directory,
      '    - id: "move-left"\n      label:',
      '    - id: "move-right"\n      label:',
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "identifier.duplicate",
          file: lessonFile,
          path: "modelCheck.options[1].id",
          message: 'Identifier "move-right" is duplicated.',
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects an action that references a missing scene object", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await replaceInLessonYaml(
      directory,
      'objectId: "values"',
      'objectId: "missing-values"',
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        {
          code: "reference.broken",
          file: lessonFile,
          path: "timeline[0].actions[0].objectId",
          message:
            'Reference "missing-values" does not resolve to a scene object.',
        },
      ],
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects a pointer that references a missing array", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await replaceInLessonYaml(
      directory,
      'targetObjectId: "values"',
      'targetObjectId: "missing-values"',
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "reference.broken",
          file: lessonFile,
          path: "scene.objects[1].targetObjectId",
          message:
            'Reference "missing-values" does not resolve to a scene object.',
        },
      ]),
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects a pointer target that resolves to the wrong primitive kind", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await applyInvalidFixture(directory, "reference/wrong-pointer-kind.json");
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "reference.wrong-kind",
          file: lessonFile,
          path: "scene.objects[1].targetObjectId",
          message:
            'Reference "target-label" must resolve to an array, but resolves to a label.',
        },
      ]),
    });
  } finally {
    await rm(join(directory, "..", ".."), { force: true, recursive: true });
  }
});

test("rejects a comparison that references a missing object", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await replaceInLessonYaml(
      directory,
      'arrayObjectId: "values"',
      'arrayObjectId: "missing-values"',
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "reference.broken",
          file: lessonFile,
          path: "scene.objects[4].arrayObjectId",
          message:
            'Reference "missing-values" does not resolve to a scene object.',
        },
      ]),
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects a comparison array reference with the wrong primitive kind", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await applyInvalidFixture(
      directory,
      "reference/wrong-comparison-array-kind.json",
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "reference.wrong-kind",
          file: lessonFile,
          path: "scene.objects[4].arrayObjectId",
          message:
            'Reference "target-label" must resolve to an array, but resolves to a label.',
        },
      ]),
    });
  } finally {
    await rm(join(directory, "..", ".."), { force: true, recursive: true });
  }
});

test.each([
  ["leftPointerId", 'leftPointerId: "left-pointer"'],
  ["rightPointerId", 'rightPointerId: "right-pointer"'],
] as const)(
  "rejects a comparison %s reference with the wrong primitive kind",
  async (property, before) => {
    const directory = await cloneCanonicalLesson();
    const lessonFile = join(directory, "lesson.yaml");

    try {
      await replaceInLessonYaml(directory, before, `${property}: "values"`);
      const compilation = compileLessonPackage(directory);

      await expect(compilation).rejects.toMatchObject({
        diagnostics: expect.arrayContaining([
          {
            code: "reference.wrong-kind",
            file: lessonFile,
            path: `scene.objects[4].${property}`,
            message:
              'Reference "values" must resolve to a pointer, but resolves to an array.',
          },
        ]),
      });
    } finally {
      await rm(join(directory, "..", ".."), {
        force: true,
        recursive: true,
      });
    }
  },
);

test("rejects a Model Check answer that references a missing option", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await replaceInLessonYaml(
      directory,
      'correctOptionId: "move-right"',
      'correctOptionId: "missing-option"',
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "reference.broken",
          file: lessonFile,
          path: "modelCheck.correctOptionId",
          message:
            'Reference "missing-option" does not resolve to a Model Check option.',
        },
      ]),
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects broken endpoint references in connect actions", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await replaceInLessonYaml(
      directory,
      [
        '      - type: "highlight"',
        '        objectId: "values"',
        "        indices: [0, 5]",
        '        tone: "compare"',
      ].join("\n"),
      [
        '      - type: "connect"',
        '        objectId: "values"',
        '        fromObjectId: "missing-pointer"',
        '        toObjectId: "right-pointer"',
      ].join("\n"),
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "reference.broken",
          file: lessonFile,
          path: "timeline[0].actions[0].fromObjectId",
          message:
            'Reference "missing-pointer" does not resolve to a scene object.',
        },
      ]),
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects connect endpoints with the wrong primitive kind", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await applyInvalidFixture(
      directory,
      "reference/wrong-connect-endpoint-kind.json",
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "reference.wrong-kind",
          file: lessonFile,
          path: "timeline[0].actions[0].fromObjectId",
          message:
            'Reference "pair-result" must resolve to a pointer, but resolves to a result.',
        },
      ]),
    });
  } finally {
    await rm(join(directory, "..", ".."), { force: true, recursive: true });
  }
});

test("requires connect actions to declare two distinct endpoints", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await replaceInLessonYaml(
      directory,
      [
        '      - type: "highlight"',
        '        objectId: "values"',
        "        indices: [0, 5]",
        '        tone: "compare"',
      ].join("\n"),
      [
        '      - type: "connect"',
        '        objectId: "values"',
        '        fromObjectId: "left-pointer"',
        '        toObjectId: "left-pointer"',
      ].join("\n"),
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "reference.invalid",
          file: lessonFile,
          path: "timeline[0].actions[0].toObjectId",
          message: "Connect actions require two distinct pointer endpoints.",
        },
      ]),
    });
  } finally {
    await rm(join(directory, "..", ".."), { force: true, recursive: true });
  }
});

test("requires a terminal timeline step", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await replaceInLessonYaml(directory, "    terminal: true\n", "");
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "timeline.terminal-required",
          file: lessonFile,
          path: "timeline",
          message: "A timeline requires a reachable terminal step.",
        },
      ]),
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects timeline steps after an early terminal", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");
  const firstNarration =
    '    narration: "Compare 1 and 15. Their sum is 16, which is greater than the target 15."';

  try {
    await replaceInLessonYaml(
      directory,
      firstNarration,
      `${firstNarration}\n    terminal: true`,
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "timeline.unreachable",
          file: lessonFile,
          path: "timeline[1].id",
          message: 'Timeline step "move-right" is unreachable.',
        },
      ]),
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects an unintended timeline cycle", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");
  const firstNarration =
    '    narration: "Compare 1 and 15. Their sum is 16, which is greater than the target 15."';

  try {
    await replaceInLessonYaml(
      directory,
      firstNarration,
      `${firstNarration}\n    nextStepId: "compare-ends"`,
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "timeline.cycle",
          file: lessonFile,
          path: "timeline[0].nextStepId",
          message: 'Timeline step "compare-ends" creates a cycle.',
        },
      ]),
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("rejects an outgoing edge declared on a terminal step", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await applyInvalidFixture(directory, "topology/terminal-back-edge.json");
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "timeline.terminal-edge",
          file: lessonFile,
          path: "timeline[7].nextStepId",
          message: 'Terminal timeline step "pair-found" cannot continue.',
        },
      ]),
    });
  } finally {
    await rm(join(directory, "..", ".."), { force: true, recursive: true });
  }
});

test("detects cycles inside an unreachable timeline subgraph", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");

  try {
    await applyInvalidFixture(directory, "topology/unreachable-cycle.json");
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "timeline.cycle",
          file: lessonFile,
          path: "timeline[2].nextStepId",
          message: 'Timeline step "move-right" creates a cycle.',
        },
        {
          code: "timeline.unreachable",
          file: lessonFile,
          path: "timeline[1].id",
          message: 'Timeline step "move-right" is unreachable.',
        },
      ]),
    });
  } finally {
    await rm(join(directory, "..", ".."), { force: true, recursive: true });
  }
});

test("rejects a timeline edge that references a missing step", async () => {
  const directory = await cloneCanonicalLesson();
  const lessonFile = join(directory, "lesson.yaml");
  const firstNarration =
    '    narration: "Compare 1 and 15. Their sum is 16, which is greater than the target 15."';

  try {
    await replaceInLessonYaml(
      directory,
      firstNarration,
      `${firstNarration}\n    nextStepId: "missing-step"`,
    );
    const compilation = compileLessonPackage(directory);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        {
          code: "reference.broken",
          file: lessonFile,
          path: "timeline[0].nextStepId",
          message:
            'Reference "missing-step" does not resolve to a timeline step.',
        },
      ]),
    });
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("sanitizes scripts, event handlers, and JavaScript URLs", async () => {
  const directory = await cloneCanonicalLesson();
  const quickUnderstandingFile = join(directory, "quick-understanding.md");
  const maliciousMarkdown = [
    "## Recognition signals",
    "",
    "Safe recognition prose.",
    "",
    '<script>alert("script")</script>',
    "",
    '<img src="x" onerror="alert(1)">',
    "",
    '[Unsafe link](javascript:alert("link"))',
    "",
    "## When it fits",
    "",
    "Safe fit prose.",
    "",
    "## Limitation",
    "",
    "Safe limitation prose.",
  ].join("\n");

  try {
    await writeFile(quickUnderstandingFile, maliciousMarkdown, "utf8");
    const lesson = await compileLessonPackage(directory);
    const html = lesson.content.quickUnderstanding.html.toLowerCase();

    expect(html).toContain("safe recognition prose");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("onerror");
    expect(html).not.toContain("javascript:");
  } finally {
    await rm(directory, { force: true, recursive: true });
  }
});

test("compiles the same package to deterministic JSON", async () => {
  const firstCompilation = await compileLessonPackage(canonicalLesson);
  const secondCompilation = await compileLessonPackage(canonicalLesson);

  expect(JSON.stringify(firstCompilation)).toBe(
    JSON.stringify(secondCompilation),
  );
});
