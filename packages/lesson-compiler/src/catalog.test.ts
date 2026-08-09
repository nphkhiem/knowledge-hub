import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, expect, test } from "vitest";
import { compileLessonCatalog, LessonPackageError } from "./index.js";

const canonicalLesson = fileURLToPath(
  new URL("../../../lessons/dsa/two-pointers/", import.meta.url),
);
const temporaryRoots = new Set<string>();

afterEach(async () => {
  const roots = [...temporaryRoots];
  temporaryRoots.clear();
  await Promise.all(
    roots.map((root) => rm(root, { force: true, recursive: true })),
  );
});

async function createTemporaryRoot(prefix: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), prefix));
  temporaryRoots.add(root);
  return root;
}

async function copyCanonicalLesson(root: string): Promise<string> {
  const directory = join(root, "dsa", "two-pointers");
  await mkdir(join(root, "dsa"), { recursive: true });
  await cp(canonicalLesson, directory, { recursive: true });
  return directory;
}

async function rejectedCatalogDiagnostics(
  directories: readonly string[],
): Promise<readonly LessonPackageError["diagnostics"][number][]> {
  try {
    await compileLessonCatalog(directories);
  } catch (error) {
    expect(error).toBeInstanceOf(LessonPackageError);
    return (error as LessonPackageError).diagnostics;
  }
  throw new Error("Expected catalog compilation to fail.");
}

test("diagnoses complete duplicate groups independently of input order", async () => {
  const firstRoot = await createTemporaryRoot("knowledge-hub-catalog-a-");
  const secondRoot = await createTemporaryRoot("knowledge-hub-catalog-b-");

  try {
    const firstDirectory = await copyCanonicalLesson(firstRoot);
    const secondDirectory = await copyCanonicalLesson(secondRoot);
    const forward = await rejectedCatalogDiagnostics([
      firstDirectory,
      secondDirectory,
    ]);
    const reversed = await rejectedCatalogDiagnostics([
      secondDirectory,
      firstDirectory,
    ]);

    expect(reversed).toEqual(forward);
    expect(forward).toHaveLength(6);
    expect(forward.map(({ code, file }) => [file, code])).toEqual(
      (await Promise.all([realpath(firstDirectory), realpath(secondDirectory)]))
        .sort()
        .flatMap((directory) => [
          [join(directory, "lesson.yaml"), "catalog.duplicate-id"],
          [join(directory, "lesson.yaml"), "catalog.duplicate-order"],
          [join(directory, "lesson.yaml"), "catalog.duplicate-route"],
        ]),
    );
  } finally {
    await Promise.all([
      rm(firstRoot, { force: true, recursive: true }),
      rm(secondRoot, { force: true, recursive: true }),
    ]);
  }
});

test("aggregates multiple package failures independently of input order", async () => {
  const firstRoot = await createTemporaryRoot("knowledge-hub-catalog-a-");
  const secondRoot = await createTemporaryRoot("knowledge-hub-catalog-b-");

  try {
    const firstDirectory = await copyCanonicalLesson(firstRoot);
    const copiedDirectory = await copyCanonicalLesson(secondRoot);
    const secondDirectory = join(secondRoot, "dsa", "sliding-window");
    await rename(copiedDirectory, secondDirectory);
    const secondLessonFile = join(secondDirectory, "lesson.yaml");
    const secondSource = await readFile(secondLessonFile, "utf8");
    await writeFile(
      secondLessonFile,
      secondSource
        .replace('id: "dsa.two-pointers"', 'id: "dsa.sliding-window"')
        .replace('slug: "two-pointers"', 'slug: "sliding-window"'),
      "utf8",
    );
    await Promise.all([
      rm(join(firstDirectory, "quick-understanding.md")),
      rm(join(secondDirectory, "real-world-applications.md")),
    ]);

    const forward = await rejectedCatalogDiagnostics([
      firstDirectory,
      secondDirectory,
    ]);
    const reversed = await rejectedCatalogDiagnostics([
      secondDirectory,
      firstDirectory,
    ]);

    expect(reversed).toEqual(forward);
    expect(forward.map(({ code, path }) => [path, code])).toEqual([
      ["content.quickUnderstanding", "file.missing"],
      ["content.realWorldApplications", "file.missing"],
    ]);
  } finally {
    await Promise.all([
      rm(firstRoot, { force: true, recursive: true }),
      rm(secondRoot, { force: true, recursive: true }),
    ]);
  }
});

test("sorts catalog diagnostics by canonical code-unit order", async () => {
  const root = await createTemporaryRoot("knowledge-hub-catalog-sort-");
  const upperDirectory = join(root, "Z-missing");
  const lowerDirectory = join(root, "a-missing");

  const diagnostics = await rejectedCatalogDiagnostics([
    lowerDirectory,
    upperDirectory,
  ]);

  expect(diagnostics.map(({ file }) => file)).toEqual([
    join(upperDirectory, "lesson.yaml"),
    join(lowerDirectory, "lesson.yaml"),
  ]);
});

test("rejects duplicate lesson ids and canonical routes", async () => {
  const firstRoot = await createTemporaryRoot("knowledge-hub-catalog-a-");
  const secondRoot = await createTemporaryRoot("knowledge-hub-catalog-b-");

  try {
    const directories = await Promise.all([
      copyCanonicalLesson(firstRoot),
      copyCanonicalLesson(secondRoot),
    ]);
    const compilation = compileLessonCatalog(directories);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: expect.arrayContaining([
        expect.objectContaining({ code: "catalog.duplicate-id", path: "id" }),
        expect.objectContaining({
          code: "catalog.duplicate-route",
          path: "slug",
        }),
      ]),
    });
  } finally {
    await Promise.all([
      rm(firstRoot, { force: true, recursive: true }),
      rm(secondRoot, { force: true, recursive: true }),
    ]);
  }
});

test("rejects duplicate collection orders", async () => {
  const firstRoot = await createTemporaryRoot("knowledge-hub-catalog-a-");
  const secondRoot = await createTemporaryRoot("knowledge-hub-catalog-b-");

  try {
    const firstDirectory = await copyCanonicalLesson(firstRoot);
    const copiedDirectory = await copyCanonicalLesson(secondRoot);
    const secondDirectory = join(secondRoot, "dsa", "sliding-window");
    await rename(copiedDirectory, secondDirectory);
    const lessonFile = join(secondDirectory, "lesson.yaml");
    const source = await readFile(lessonFile, "utf8");
    await writeFile(
      lessonFile,
      source
        .replace('id: "dsa.two-pointers"', 'id: "dsa.sliding-window"')
        .replace('slug: "two-pointers"', 'slug: "sliding-window"'),
      "utf8",
    );

    const compilation = compileLessonCatalog([firstDirectory, secondDirectory]);

    await expect(compilation).rejects.toMatchObject({
      diagnostics: [
        expect.objectContaining({
          code: "catalog.duplicate-order",
          path: "order",
        }),
        expect.objectContaining({
          code: "catalog.duplicate-order",
          path: "order",
        }),
      ],
    });
  } finally {
    await Promise.all([
      rm(firstRoot, { force: true, recursive: true }),
      rm(secondRoot, { force: true, recursive: true }),
    ]);
  }
});
