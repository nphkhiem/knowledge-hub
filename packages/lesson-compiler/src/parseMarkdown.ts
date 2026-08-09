import { toString } from "mdast-util-to-string";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import {
  LessonPackageError,
  type CompiledMarkdown,
  type CompiledRealWorldApplication,
} from "./types.js";

const markdownParser = unified().use(remarkParse);
const markdownProcessor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSanitize)
  .use(rehypeStringify);

export async function compileMarkdown(
  source: string,
  file: string,
): Promise<CompiledMarkdown> {
  try {
    const result = await markdownProcessor.process(source);
    return { html: String(result) };
  } catch {
    throw new LessonPackageError([
      {
        code: "markdown.compile",
        file,
        path: "$",
        message: "Markdown could not be compiled.",
      },
    ]);
  }
}

export async function compileQuickUnderstanding(
  source: string,
  file: string,
): Promise<CompiledMarkdown> {
  const tree = markdownParser.parse(source);
  const headings: Array<{ readonly depth: number; readonly title: string }> =
    [];
  visit(tree, "heading", (heading) => {
    headings.push({ depth: heading.depth, title: toString(heading) });
  });
  const expected = [
    { depth: 2, title: "Recognition signals" },
    { depth: 2, title: "When it fits" },
    { depth: 2, title: "Limitation" },
  ];

  if (JSON.stringify(headings) !== JSON.stringify(expected)) {
    throw new LessonPackageError([
      {
        code: "markdown.quick-understanding-structure",
        file,
        path: "content.quickUnderstanding",
        message:
          "Quick Understanding requires level-two headings: Recognition signals, When it fits, Limitation.",
      },
    ]);
  }

  const headingIndices = tree.children.flatMap((node, index) =>
    node.type === "heading" ? [index] : [],
  );
  const sectionPaths = ["recognition-signals", "when-it-fits", "limitation"];
  for (const [sectionIndex, headingIndex] of headingIndices.entries()) {
    const nextHeadingIndex =
      headingIndices[sectionIndex + 1] ?? tree.children.length;
    const containsProse = tree.children
      .slice(headingIndex + 1, nextHeadingIndex)
      .some((node) => toString(node).trim().length > 0);
    if (!containsProse) {
      throw new LessonPackageError([
        {
          code: "markdown.quick-understanding-content",
          file,
          path: `content.quickUnderstanding.${sectionPaths[sectionIndex]}`,
          message: "Each Quick Understanding section requires prose.",
        },
      ]);
    }
  }

  return compileMarkdown(source, file);
}

function toId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function applicationStructureError(
  file: string,
  applicationIndex: number,
): LessonPackageError {
  return new LessonPackageError([
    {
      code: "markdown.application-structure",
      file,
      path: `content.realWorldApplications[${applicationIndex}]`,
      message:
        "Each Real-World Application requires Situation, Why it fits, Application, and Constraint level-three sections.",
    },
  ]);
}

export async function compileRealWorldApplications(
  source: string,
  file: string,
): Promise<readonly CompiledRealWorldApplication[]> {
  const tree = markdownParser.parse(source);
  const applicationHeadingIndices = tree.children.flatMap((node, index) =>
    node.type === "heading" && node.depth === 2 ? [index] : [],
  );

  if (
    applicationHeadingIndices.length === 0 ||
    applicationHeadingIndices.length > 3
  ) {
    throw new LessonPackageError([
      {
        code: "markdown.application-count",
        file,
        path: "content.realWorldApplications",
        message: "A lesson requires one to three Real-World Applications.",
      },
    ]);
  }
  const firstApplicationHeadingIndex = applicationHeadingIndices[0];
  if (
    firstApplicationHeadingIndex === undefined ||
    tree.children
      .slice(0, firstApplicationHeadingIndex)
      .some((node) => toString(node).trim().length > 0)
  ) {
    throw new LessonPackageError([
      {
        code: "markdown.application-structure",
        file,
        path: "content.realWorldApplications",
        message:
          "Real-World Applications content must begin with an application heading.",
      },
    ]);
  }

  const expectedSections = [
    { depth: 3, title: "Situation" },
    { depth: 3, title: "Why it fits" },
    { depth: 3, title: "Application" },
    { depth: 3, title: "Constraint" },
  ];
  const applications: CompiledRealWorldApplication[] = [];

  for (const [
    applicationIndex,
    headingIndex,
  ] of applicationHeadingIndices.entries()) {
    const heading = tree.children[headingIndex];
    if (heading?.type !== "heading") {
      throw applicationStructureError(file, applicationIndex);
    }
    const nextHeadingIndex =
      applicationHeadingIndices[applicationIndex + 1] ?? tree.children.length;
    const bodyNodes = tree.children.slice(headingIndex + 1, nextHeadingIndex);
    const sectionHeadings = bodyNodes.flatMap((node) =>
      node.type === "heading"
        ? [{ depth: node.depth, title: toString(node) }]
        : [],
    );
    if (JSON.stringify(sectionHeadings) !== JSON.stringify(expectedSections)) {
      throw applicationStructureError(file, applicationIndex);
    }
    const sectionHeadingIndices = bodyNodes.flatMap((node, index) =>
      node.type === "heading" ? [index] : [],
    );
    const sectionPaths = [
      "situation",
      "why-it-fits",
      "application",
      "constraint",
    ];
    for (const [
      sectionIndex,
      sectionHeadingIndex,
    ] of sectionHeadingIndices.entries()) {
      const nextSectionHeadingIndex =
        sectionHeadingIndices[sectionIndex + 1] ?? bodyNodes.length;
      const containsProse = bodyNodes
        .slice(sectionHeadingIndex + 1, nextSectionHeadingIndex)
        .some((node) => toString(node).trim().length > 0);
      if (!containsProse) {
        throw new LessonPackageError([
          {
            code: "markdown.application-content",
            file,
            path: `content.realWorldApplications[${applicationIndex}].${sectionPaths[sectionIndex]}`,
            message: "Each Real-World Application section requires prose.",
          },
        ]);
      }
    }

    const title = toString(heading).trim();
    const bodyStart = heading.position?.end.offset;
    const nextHeading = tree.children[nextHeadingIndex];
    const bodyEnd = nextHeading?.position?.start.offset ?? source.length;
    if (title.length === 0 || bodyStart === undefined) {
      throw applicationStructureError(file, applicationIndex);
    }
    const body = source.slice(bodyStart, bodyEnd).trim();
    const id = toId(title);
    if (
      id.length === 0 ||
      applications.some((application) => application.id === id)
    ) {
      throw new LessonPackageError([
        {
          code: "markdown.application-id",
          file,
          path: `content.realWorldApplications[${applicationIndex}].id`,
          message:
            "Application titles must produce unique, non-empty identifiers.",
        },
      ]);
    }
    applications.push({
      id,
      title,
      ...(await compileMarkdown(body, file)),
    });
  }

  return applications;
}
