import { URL as NodeURL, fileURLToPath } from "node:url";
import { compileLessonPackage } from "@knowledge-hub/lesson-compiler";

/**
 * Node's URL is used explicitly rather than the global one: under a jsdom
 * environment the global resolves relative paths against the document base,
 * producing an http URL that `fileURLToPath` rightly rejects.
 */
const twoPointersDirectory = fileURLToPath(
  new NodeURL("../../../lessons/dsa/two-pointers/", import.meta.url),
);

export const compiledTwoPointersLesson =
  await compileLessonPackage(twoPointersDirectory);
