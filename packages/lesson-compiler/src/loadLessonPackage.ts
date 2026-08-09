import { readFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import {
  migrateLessonSource,
  type LessonDiagnostic,
} from "@knowledge-hub/lesson-schema";
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

interface DeclaredContentSources {
  readonly quickUnderstanding: string;
  readonly realWorldApplications: string;
  readonly deepDive?: string;
}

async function readDeclaredContentSources(
  directory: string,
  content: {
    readonly quickUnderstanding: string;
    readonly realWorldApplications: string;
    readonly deepDive?: string | undefined;
  },
): Promise<DeclaredContentSources> {
  const declarations = [
    {
      key: "quickUnderstanding" as const,
      filename: content.quickUnderstanding,
      path: "content.quickUnderstanding",
    },
    {
      key: "realWorldApplications" as const,
      filename: content.realWorldApplications,
      path: "content.realWorldApplications",
    },
    ...(content.deepDive
      ? [
          {
            key: "deepDive" as const,
            filename: content.deepDive,
            path: "content.deepDive",
          },
        ]
      : []),
  ];
  const results = await Promise.all(
    declarations.map(async ({ filename, key, path }) => {
      const file = join(directory, filename);
      try {
        return { ok: true as const, key, source: await readFile(file, "utf8") };
      } catch {
        return {
          ok: false as const,
          diagnostic: {
            code: "file.missing" as const,
            file,
            path,
            message: "Required lesson file is missing or unreadable.",
          } satisfies LessonDiagnostic,
        };
      }
    }),
  );
  const diagnostics = results.flatMap((result) =>
    result.ok ? [] : [result.diagnostic],
  );
  if (diagnostics.length > 0) throw new LessonPackageError(diagnostics);

  let quickUnderstanding = "";
  let realWorldApplications = "";
  let deepDive: string | undefined;
  for (const result of results) {
    if (!result.ok) continue;
    if (result.key === "quickUnderstanding") {
      quickUnderstanding = result.source;
    } else if (result.key === "realWorldApplications") {
      realWorldApplications = result.source;
    } else {
      deepDive = result.source;
    }
  }
  return {
    quickUnderstanding,
    realWorldApplications,
    ...(deepDive === undefined ? {} : { deepDive }),
  };
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
  const packageSlug = basename(directory);
  const packageDomain = basename(dirname(directory));
  const identityDiagnostics = [
    ...(source.domain === packageDomain
      ? []
      : [
          {
            code: "identity.directory-mismatch" as const,
            file: lessonFile,
            path: "domain",
            message: `Lesson domain "${source.domain}" must match package directory "${packageDomain}".`,
          },
        ]),
    ...(source.slug === packageSlug
      ? []
      : [
          {
            code: "identity.directory-mismatch" as const,
            file: lessonFile,
            path: "slug",
            message: `Lesson slug "${source.slug}" must match package directory "${packageSlug}".`,
          },
        ]),
  ];
  const semanticDiagnostics = [
    ...identityDiagnostics,
    ...validateLessonSemantics(source, lessonFile),
  ];
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
  const contentSources = await readDeclaredContentSources(
    directory,
    source.content,
  );
  const deepDive =
    source.content.deepDive && contentSources.deepDive !== undefined
      ? await compileMarkdown(
          contentSources.deepDive,
          join(directory, source.content.deepDive),
        )
      : undefined;

  return {
    ...source,
    content: {
      quickUnderstanding: await compileQuickUnderstanding(
        contentSources.quickUnderstanding,
        quickUnderstandingFile,
      ),
      realWorldApplications: await compileRealWorldApplications(
        contentSources.realWorldApplications,
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
