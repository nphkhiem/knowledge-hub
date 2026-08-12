import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";

import { lessonPath } from "./routes.js";

export interface Neighbor {
  readonly title: string;
  readonly href: string;
}

export interface Neighbors {
  readonly previous?: Neighbor;
  readonly next?: Neighbor;
}

/**
 * The published lessons either side of one lesson in its collection.
 *
 * Adjacency follows declared order rather than a gap-free sequence, so an
 * unwritten lesson in the middle of a collection does not sever the two lessons
 * around it. Only published lessons are returned, because a link to an
 * unwritten lesson is a dead link.
 */
export function findNeighbors(
  lessons: readonly CompiledLesson[],
  current: CompiledLesson,
): Neighbors {
  const ordered = lessons
    .filter((lesson) => lesson.collection === current.collection)
    .sort((left, right) => left.order - right.order);

  const position = ordered.findIndex((lesson) => lesson.slug === current.slug);
  if (position === -1) return {};

  const previous = ordered[position - 1];
  const next = ordered[position + 1];

  return {
    ...(previous === undefined
      ? {}
      : {
          previous: {
            title: previous.title,
            href: lessonPath(previous.domain, previous.slug),
          },
        }),
    ...(next === undefined
      ? {}
      : {
          next: {
            title: next.title,
            href: lessonPath(next.domain, next.slug),
          },
        }),
  };
}
