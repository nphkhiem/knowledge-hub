import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { compileLessonCatalog } from "./index.js";

const canonicalLesson = fileURLToPath(
  new URL("../../../lessons/dsa/two-pointers/", import.meta.url),
);

async function copyCanonicalLesson(root: string): Promise<string> {
  const directory = join(root, "dsa", "two-pointers");
  await mkdir(join(root, "dsa"), { recursive: true });
  await cp(canonicalLesson, directory, { recursive: true });
  return directory;
}

test("rejects duplicate lesson ids and canonical routes", async () => {
  const firstRoot = await mkdtemp(join(tmpdir(), "knowledge-hub-catalog-a-"));
  const secondRoot = await mkdtemp(join(tmpdir(), "knowledge-hub-catalog-b-"));

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
  const firstRoot = await mkdtemp(join(tmpdir(), "knowledge-hub-catalog-a-"));
  const secondRoot = await mkdtemp(join(tmpdir(), "knowledge-hub-catalog-b-"));

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
          file: lessonFile,
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
