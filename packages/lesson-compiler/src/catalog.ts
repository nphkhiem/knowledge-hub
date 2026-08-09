import { access, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
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
  return compileLessonCatalog(lessonDirectories);
}

export async function compileLessonCatalog(
  lessonDirectories: readonly string[],
): Promise<readonly CompiledLesson[]> {
  const entries = await Promise.all(
    lessonDirectories.map(async (directory) => ({
      directory,
      lesson: await compileLessonPackage(directory),
    })),
  );
  const ids = new Set<string>();
  const collectionOrders = new Set<string>();
  const routes = new Set<string>();
  const diagnostics = entries.flatMap(({ directory, lesson }) => {
    const entryDiagnostics = [];
    const route = `${lesson.domain}/${lesson.slug}`;
    const collectionOrder = `${lesson.collection}/${lesson.order}`;
    if (ids.has(lesson.id)) {
      entryDiagnostics.push({
        code: "catalog.duplicate-id" as const,
        file: join(directory, "lesson.yaml"),
        path: "id",
        message: `Lesson id "${lesson.id}" is duplicated in the catalog.`,
      });
    }
    if (routes.has(route)) {
      entryDiagnostics.push({
        code: "catalog.duplicate-route" as const,
        file: join(directory, "lesson.yaml"),
        path: "slug",
        message: `Lesson route "${route}" is duplicated in the catalog.`,
      });
    }
    if (collectionOrders.has(collectionOrder)) {
      entryDiagnostics.push({
        code: "catalog.duplicate-order" as const,
        file: join(directory, "lesson.yaml"),
        path: "order",
        message: `Order ${lesson.order} is duplicated in collection "${lesson.collection}".`,
      });
    }
    ids.add(lesson.id);
    collectionOrders.add(collectionOrder);
    routes.add(route);
    return entryDiagnostics;
  });
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
