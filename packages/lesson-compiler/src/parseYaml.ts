import type {
  LessonDiagnostic,
  ValidationResult,
} from "@knowledge-hub/lesson-schema";
import { isScalar, parseAllDocuments, visit } from "yaml";

function findEmbeddedHtml(
  value: unknown,
  file: string,
  path = "$",
): readonly LessonDiagnostic[] {
  if (typeof value === "string" && /<(?:!--|\/?[A-Za-z])[^>]*>/u.test(value)) {
    return [
      {
        code: "yaml.embedded-html",
        file,
        path,
        message: "HTML is not allowed in lesson YAML.",
      },
    ];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) =>
      findEmbeddedHtml(item, file, `${path}[${index}]`),
    );
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([key, item]) =>
      findEmbeddedHtml(item, file, path === "$" ? key : `${path}.${key}`),
    );
  }
  return [];
}

export function parseRestrictedYaml(
  source: string,
  file: string,
): ValidationResult<unknown> {
  const documents = parseAllDocuments(source, {
    customTags: [],
    merge: false,
    schema: "json",
    stringKeys: true,
    uniqueKeys: true,
  });
  const diagnostics: LessonDiagnostic[] = [];
  const document = documents[0];

  if (documents.length !== 1) {
    diagnostics.push({
      code: "yaml.multiple-documents",
      file,
      path: "$",
      message: "A lesson source must contain exactly one YAML document.",
    });
  }

  if (document) {
    if (
      document.directives.yaml.explicit ||
      Object.keys(document.directives.tags).some((tag) => tag !== "!!")
    ) {
      diagnostics.push({
        code: "yaml.directive",
        file,
        path: "$",
        message: "YAML directives are not allowed.",
      });
    }
    if (document.errors.some((error) => error.code === "DUPLICATE_KEY")) {
      diagnostics.push({
        code: "yaml.duplicate-key",
        file,
        path: "$",
        message: "YAML keys must be unique.",
      });
    }
    if (document.errors.some((error) => error.code !== "DUPLICATE_KEY")) {
      diagnostics.push({
        code: "yaml.syntax",
        file,
        path: "$",
        message: "The YAML document is malformed.",
      });
    }
    if (document.warnings.length > 0) {
      diagnostics.push({
        code: "yaml.warning",
        file,
        path: "$",
        message: "The YAML parser reported a warning.",
      });
    }
    let containsAlias = false;
    let containsMerge = false;
    let containsTag = false;
    visit(document, {
      Alias() {
        containsAlias = true;
      },
      Node(_key, node) {
        if (node.anchor !== undefined) containsAlias = true;
        if (node.tag !== undefined) containsTag = true;
      },
      Pair(_key, pair) {
        if (isScalar(pair.key) && pair.key.value === "<<") {
          containsMerge = true;
        }
      },
    });
    if (containsAlias) {
      diagnostics.push({
        code: "yaml.alias",
        file,
        path: "$",
        message: "YAML aliases and anchors are not allowed.",
      });
    }
    if (containsMerge) {
      diagnostics.push({
        code: "yaml.merge",
        file,
        path: "$",
        message: "YAML merge pairs are not allowed.",
      });
    }
    if (containsTag) {
      diagnostics.push({
        code: "yaml.tag",
        file,
        path: "$",
        message: "Explicit YAML tags are not allowed.",
      });
    }
  }

  if (diagnostics.length > 0) return { ok: false, diagnostics };
  const value = document?.toJSON();
  const htmlDiagnostics = findEmbeddedHtml(value, file);
  if (htmlDiagnostics.length > 0) {
    return { ok: false, diagnostics: htmlDiagnostics };
  }
  return { ok: true, value };
}
