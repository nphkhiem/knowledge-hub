import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { lessonSourceV1Schema } from "@knowledge-hub/lesson-schema";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { parseDocument, visit } from "yaml";
import {
  LessonPackageError,
  type CompiledLesson,
  type CompiledMarkdown,
  type CompiledRealWorldApplication,
  type LessonPackageDiagnostic,
  type LoadedLessonPackage,
} from "./types.js";

async function readSourceFile(
  directory: string,
  filename: string,
): Promise<string> {
  const file = join(directory, filename);

  try {
    return await readFile(file, "utf8");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to read file";
    throw new LessonPackageError([{ file, message }]);
  }
}

function parseLessonSource(source: string, file: string) {
  const document = parseDocument(source, {
    customTags: [],
    schema: "json",
    stringKeys: true,
    uniqueKeys: true,
  });
  const diagnostics: LessonPackageDiagnostic[] = [
    ...document.errors,
    ...document.warnings,
  ].map(({ message }) => ({ file, message }));

  visit(document, {
    Alias() {
      diagnostics.push({
        file,
        message: "YAML aliases are not allowed in lesson sources",
      });
    },
  });

  if (diagnostics.length > 0) {
    throw new LessonPackageError(diagnostics);
  }

  const result = lessonSourceV1Schema.safeParse(document.toJS());

  if (!result.success) {
    throw new LessonPackageError(
      result.error.issues.map((issue) => ({
        file,
        message: `${issue.path.join(".") || "source"}: ${issue.message}`,
      })),
    );
  }

  return result.data;
}

const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeStringify);

async function compileMarkdown(
  source: string,
  file: string,
): Promise<CompiledMarkdown> {
  try {
    const result = await markdownProcessor.process(source);
    return { html: String(result) };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to compile Markdown";
    throw new LessonPackageError([{ file, message }]);
  }
}

function toId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function compileRealWorldApplications(
  source: string,
  file: string,
): Promise<readonly CompiledRealWorldApplication[]> {
  const sections = source
    .split(/^## /mu)
    .slice(1)
    .map((section) => {
      const newline = section.indexOf("\n");
      const title = (
        newline === -1 ? section : section.slice(0, newline)
      ).trim();
      const body = newline === -1 ? "" : section.slice(newline + 1).trim();
      return { body, title };
    })
    .filter(({ title }) => title.length > 0);

  if (sections.length === 0) {
    throw new LessonPackageError([
      {
        file,
        message:
          "Real-World Applications must contain at least one level-two section",
      },
    ]);
  }

  return Promise.all(
    sections.map(async ({ body, title }) => ({
      id: toId(title),
      title,
      ...(await compileMarkdown(body, file)),
    })),
  );
}

export async function loadLessonPackage(
  directory: string,
): Promise<LoadedLessonPackage> {
  const lessonFile = join(directory, "lesson.yaml");
  const source = parseLessonSource(
    await readSourceFile(directory, "lesson.yaml"),
    lessonFile,
  );
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
      readSourceFile(directory, source.content.quickUnderstanding),
      readSourceFile(directory, source.content.realWorldApplications),
    ]);
  const deepDive = source.content.deepDive
    ? await compileMarkdown(
        await readSourceFile(directory, source.content.deepDive),
        join(directory, source.content.deepDive),
      )
    : undefined;

  return {
    ...source,
    content: {
      quickUnderstanding: await compileMarkdown(
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
