import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { migrateLessonSource } from "@knowledge-hub/lesson-schema";
import { parseRestrictedYaml } from "./parseYaml.js";
import {
  compileMarkdown,
  compileQuickUnderstanding,
  compileRealWorldApplications,
} from "./parseMarkdown.js";
import { validateLessonSemantics } from "./validateSemantics.js";
import {
  LessonPackageError,
  type CompiledLesson,
  type LoadedLessonPackage,
} from "./types.js";

async function readSourceFile(
  directory: string,
  filename: string,
  path: string,
): Promise<string> {
  const file = join(directory, filename);

  try {
    return await readFile(file, "utf8");
  } catch {
    throw new LessonPackageError([
      {
        code: "file.missing",
        file,
        path,
        message: "Required lesson file is missing or unreadable.",
      },
    ]);
  }
}

function parseLessonSource(source: string, file: string) {
  const parsed = parseRestrictedYaml(source, file);
  if (!parsed.ok) throw new LessonPackageError(parsed.diagnostics);

  const migrated = migrateLessonSource(parsed.value, file);
  if (!migrated.ok) throw new LessonPackageError(migrated.diagnostics);
  return migrated.value;
}

export async function loadLessonPackage(
  directory: string,
): Promise<LoadedLessonPackage> {
  const lessonFile = join(directory, "lesson.yaml");
  const source = parseLessonSource(
    await readSourceFile(directory, "lesson.yaml", "$"),
    lessonFile,
  );
  const semanticDiagnostics = validateLessonSemantics(source, lessonFile);
  if (semanticDiagnostics.length > 0) {
    throw new LessonPackageError(semanticDiagnostics);
  }
  const quickUnderstandingFile = join(
    directory,
    source.content.quickUnderstanding,
  );
  const realWorldApplicationsFile = join(
    directory,
    source.content.realWorldApplications,
  );
  const [quickUnderstandingSource, realWorldApplicationsSource] =
    await Promise.all([
      readSourceFile(
        directory,
        source.content.quickUnderstanding,
        "content.quickUnderstanding",
      ),
      readSourceFile(
        directory,
        source.content.realWorldApplications,
        "content.realWorldApplications",
      ),
    ]);
  const deepDive = source.content.deepDive
    ? await compileMarkdown(
        await readSourceFile(
          directory,
          source.content.deepDive,
          "content.deepDive",
        ),
        join(directory, source.content.deepDive),
      )
    : undefined;

  return {
    ...source,
    content: {
      quickUnderstanding: await compileQuickUnderstanding(
        quickUnderstandingSource,
        quickUnderstandingFile,
      ),
      realWorldApplications: await compileRealWorldApplications(
        realWorldApplicationsSource,
        realWorldApplicationsFile,
      ),
      ...(deepDive ? { deepDive } : {}),
    },
  } satisfies CompiledLesson;
}

export async function compileLessonPackage(
  directory: string,
): Promise<CompiledLesson> {
  return loadLessonPackage(directory);
}
