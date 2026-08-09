import { lstat, readFile, realpath } from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
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
import { compileLessonAtPath } from "./compileLesson.js";

async function readSourceFile(
  canonicalDirectory: string,
  displayDirectory: string,
  filename: string,
  path: string,
): Promise<string> {
  const file = join(displayDirectory, filename);
  const canonicalFile = resolve(canonicalDirectory, filename);

  try {
    const fileStats = await lstat(canonicalFile);
    if (fileStats.isSymbolicLink() || !fileStats.isFile()) {
      throw new LessonPackageError([
        {
          code: "file.unsafe",
          file,
          path,
          message:
            "Lesson files must be regular, non-symbolic files inside the package.",
        },
      ]);
    }
    const resolvedFile = await realpath(canonicalFile);
    const relativePath = relative(canonicalDirectory, resolvedFile);
    const outsidePackage =
      relativePath === ".." ||
      relativePath.startsWith(`..${sep}`) ||
      isAbsolute(relativePath);
    if (outsidePackage) {
      throw new LessonPackageError([
        {
          code: "file.unsafe",
          file,
          path,
          message:
            "Lesson files must be regular, non-symbolic files inside the package.",
        },
      ]);
    }
    return await readFile(resolvedFile, "utf8");
  } catch (error) {
    if (error instanceof LessonPackageError) throw error;
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

async function canonicalizePackageRoot(directory: string): Promise<string> {
  try {
    return await realpath(directory);
  } catch {
    throw new LessonPackageError([
      {
        code: "file.missing",
        file: join(directory, "lesson.yaml"),
        path: "$",
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
  canonicalDirectory: string,
  displayDirectory: string,
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
      try {
        return {
          ok: true as const,
          key,
          source: await readSourceFile(
            canonicalDirectory,
            displayDirectory,
            filename,
            path,
          ),
        };
      } catch (error) {
        if (error instanceof LessonPackageError) {
          return { ok: false as const, diagnostics: error.diagnostics };
        }
        throw error;
      }
    }),
  );
  const diagnostics = results.flatMap((result) =>
    result.ok ? [] : result.diagnostics,
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
  const canonicalDirectory = await canonicalizePackageRoot(directory);
  const lessonFile = join(directory, "lesson.yaml");
  const source = parseLessonSource(
    await readSourceFile(canonicalDirectory, directory, "lesson.yaml", "$"),
    lessonFile,
  );
  const packageSlug = basename(canonicalDirectory);
  const packageDomain = basename(dirname(canonicalDirectory));
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
    canonicalDirectory,
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

  const content = {
    quickUnderstanding: await compileQuickUnderstanding(
      contentSources.quickUnderstanding,
      quickUnderstandingFile,
    ),
    realWorldApplications: await compileRealWorldApplications(
      contentSources.realWorldApplications,
      realWorldApplicationsFile,
    ),
    ...(deepDive ? { deepDive } : {}),
  };
  const compiled = compileLessonAtPath(source, content, lessonFile);
  if (!compiled.ok) throw new LessonPackageError(compiled.diagnostics);
  return compiled.value;
}

export async function compileLessonPackage(
  directory: string,
): Promise<CompiledLesson> {
  return loadLessonPackage(directory);
}
