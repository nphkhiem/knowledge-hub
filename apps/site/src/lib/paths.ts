import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";

import {
  INTERVIEW_FOUNDATIONS_TOTAL,
  summarizeCollection,
  type CollectionEntry,
} from "./collection.js";

export interface LearningPathDefinition {
  readonly slug: string;
  readonly collection: CompiledLesson["collection"];
  readonly title: string;
  readonly purpose: string;
  readonly totalCount: number;
}

/**
 * Learning Paths are declared rather than derived, so a path exists and can be
 * described before all of its lessons are written. Deriving them from published
 * lessons would make a half-written path look complete.
 */
export const LEARNING_PATHS: readonly LearningPathDefinition[] = [
  {
    slug: "interview-foundations",
    collection: "interview-foundations",
    title: "Interview Foundations",
    purpose:
      "The ideas that come up most often in demanding technical interviews, across data structures and algorithms, networking, and system design. Read them in order to build up, or open any one on its own.",
    totalCount: INTERVIEW_FOUNDATIONS_TOTAL,
  },
];

export interface PathSummary extends LearningPathDefinition {
  readonly lessons: readonly CollectionEntry[];
  readonly publishedCount: number;
  readonly totalMinutes: number;
  readonly domains: readonly CompiledLesson["domain"][];
  readonly isComplete: boolean;
}

/**
 * Describes every declared path against what is currently published.
 *
 * A path with no published lessons is still described. It is a real
 * recommendation whose content is being written, not an absent thing.
 */
export function summarizePaths(
  lessons: readonly CompiledLesson[],
): readonly PathSummary[] {
  return LEARNING_PATHS.map((definition) => {
    const summary = summarizeCollection(lessons, definition.collection);
    return {
      ...definition,
      lessons: summary.lessons,
      publishedCount: summary.publishedCount,
      totalMinutes: summary.totalMinutes,
      domains: summary.domains,
      isComplete: summary.publishedCount >= definition.totalCount,
    };
  });
}

/** One declared path by slug, or undefined when no such path exists. */
export function findPath(
  lessons: readonly CompiledLesson[],
  slug: string,
): PathSummary | undefined {
  return summarizePaths(lessons).find((path) => path.slug === slug);
}
