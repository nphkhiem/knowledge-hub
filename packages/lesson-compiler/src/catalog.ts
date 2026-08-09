import { access, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { compileLessonPackage } from "./loadLessonPackage.js";
import type { CompiledLesson } from "./types.js";

async function findWorkspaceRoot(start: string): Promise<string> {
  let directory = start;

  for (;;) {
    try {
      await access(join(directory, "pnpm-workspace.yaml"));
      return directory;
    } catch {
      const parent = dirname(directory);
      if (parent === directory) {
        throw new Error(`Unable to locate the workspace root from ${start}`);
      }
      directory = parent;
    }
  }
}

async function childDirectories(directory: string): Promise<readonly string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(directory, entry.name))
    .sort((left, right) => left.localeCompare(right));
}

export async function getCompiledLessons(): Promise<readonly CompiledLesson[]> {
  const lessonsDirectory = join(
    await findWorkspaceRoot(process.cwd()),
    "lessons",
  );
  const domains = await childDirectories(lessonsDirectory);
  const lessonDirectories = (
    await Promise.all(domains.map((domain) => childDirectories(domain)))
  ).flat();
  const lessons = await Promise.all(
    lessonDirectories.map(compileLessonPackage),
  );

  return lessons.sort((left, right) => left.order - right.order);
}

export async function getCompiledLesson(
  domain: string,
  slug: string,
): Promise<CompiledLesson | undefined> {
  return (await getCompiledLessons()).find(
    (lesson) => lesson.domain === domain && lesson.slug === slug,
  );
}
