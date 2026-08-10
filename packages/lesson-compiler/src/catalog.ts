import { access, readdir, realpath } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { compareCodeUnits } from "@knowledge-hub/lesson-schema";
import { compileLessonPackage } from "./loadLessonPackage.js";
import { LessonPackageError, type CompiledLesson } from "./types.js";

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
    .sort(compareCodeUnits);
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
  return compileLessonCatalog(lessonDirectories);
}

export async function compileLessonCatalog(
  lessonDirectories: readonly string[],
): Promise<readonly CompiledLesson[]> {
  const packageResults = await Promise.all(
    lessonDirectories.map(async (inputDirectory) => {
      let directory: string;
      try {
        directory = await realpath(inputDirectory);
      } catch {
        return {
          ok: false as const,
          diagnostics: [
            {
              code: "file.missing" as const,
              file: resolve(inputDirectory, "lesson.yaml"),
              path: "$",
              message: "Required lesson file is missing or unreadable.",
            },
          ],
        };
      }
      try {
        return {
          ok: true as const,
          entry: {
            directory,
            lesson: await compileLessonPackage(directory),
          },
        };
      } catch (error) {
        if (error instanceof LessonPackageError) {
          return {
            ok: false as const,
            diagnostics: error.diagnostics,
          };
        }
        throw error;
      }
    }),
  );
  const packageDiagnostics = packageResults.flatMap((result) =>
    result.ok ? [] : result.diagnostics,
  );
  const entries = packageResults
    .flatMap((result) => (result.ok ? [result.entry] : []))
    .sort((left, right) => compareCodeUnits(left.directory, right.directory));
  const duplicateGroups = <T>(
    keyOf: (entry: (typeof entries)[number]) => T,
  ) => {
    const groups = new Map<T, (typeof entries)[number][]>();
    for (const entry of entries) {
      const key = keyOf(entry);
      groups.set(key, [...(groups.get(key) ?? []), entry]);
    }
    return [...groups.entries()].filter(([, group]) => group.length > 1);
  };
  const catalogDiagnostics = [
    ...duplicateGroups(({ lesson }) => lesson.id).flatMap(([id, group]) =>
      group.map(({ directory }) => ({
        code: "catalog.duplicate-id" as const,
        file: join(directory, "lesson.yaml"),
        path: "id",
        message: `Lesson id "${id}" is duplicated in the catalog.`,
      })),
    ),
    ...duplicateGroups(
      ({ lesson }) => `${lesson.domain}/${lesson.slug}`,
    ).flatMap(([route, group]) =>
      group.map(({ directory }) => ({
        code: "catalog.duplicate-route" as const,
        file: join(directory, "lesson.yaml"),
        path: "slug",
        message: `Lesson route "${route}" is duplicated in the catalog.`,
      })),
    ),
    ...duplicateGroups(
      ({ lesson }) => `${lesson.collection}/${lesson.order}`,
    ).flatMap(([, group]) =>
      group.map(({ directory, lesson }) => ({
        code: "catalog.duplicate-order" as const,
        file: join(directory, "lesson.yaml"),
        path: "order",
        message: `Order ${lesson.order} is duplicated in collection "${lesson.collection}".`,
      })),
    ),
  ];
  const diagnostics = [...packageDiagnostics, ...catalogDiagnostics];
  if (diagnostics.length > 0) throw new LessonPackageError(diagnostics);

  return entries
    .map(({ lesson }) => lesson)
    .sort((left, right) => left.order - right.order);
}

export async function getCompiledLesson(
  domain: string,
  slug: string,
): Promise<CompiledLesson | undefined> {
  return (await getCompiledLessons()).find(
    (lesson) => lesson.domain === domain && lesson.slug === slug,
  );
}
