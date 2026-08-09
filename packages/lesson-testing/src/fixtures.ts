import { fileURLToPath } from "node:url";
import { compileLessonPackage } from "@knowledge-hub/lesson-compiler";

const twoPointersDirectory = fileURLToPath(
  new URL("../../../lessons/dsa/two-pointers/", import.meta.url),
);

export const compiledTwoPointersLesson =
  await compileLessonPackage(twoPointersDirectory);
