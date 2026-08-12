import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";

/**
 * The planned size of Interview Foundations, from `CONTEXT.md`: fifteen
 * lessons, seven DSA, two networking, and six system design.
 *
 * This is the one figure Home cannot derive from data, because an unpublished
 * lesson has no files to count. A test pins it to the approved number so it
 * cannot drift away from the collection it describes.
 */
export const INTERVIEW_FOUNDATIONS_TOTAL = 15;

/** One lesson as a collection listing needs it. */
export interface CollectionEntry {
  readonly slug: string;
  readonly difficulty: CompiledLesson["difficulty"];
  readonly domain: CompiledLesson["domain"];
  readonly title: string;
  readonly objective: string;
  readonly durationMinutes: number;
  readonly order: number;
}

export interface CollectionSummary {
  /** Published lessons in their recommended reading order. */
  readonly lessons: readonly CollectionEntry[];
  readonly publishedCount: number;
  readonly totalCount: number;
  /** Reading time of what is published, not of the finished collection. */
  readonly totalMinutes: number;
  /** Domains represented by published lessons, each once, in a stable order. */
  readonly domains: readonly CompiledLesson["domain"][];
  readonly isComplete: boolean;
}

/**
 * Describes one collection from the compiled catalog.
 *
 * Reports what is published rather than what is planned, so a partly written
 * collection is presented honestly instead of implying a full library. The
 * catalog is not mutated: it is copied before sorting.
 */
export function summarizeCollection(
  lessons: readonly CompiledLesson[],
  collection: CompiledLesson["collection"],
): CollectionSummary {
  const entries = lessons
    .filter((lesson) => lesson.collection === collection)
    .map((lesson): CollectionEntry => ({
      slug: lesson.slug,
      difficulty: lesson.difficulty,
      domain: lesson.domain,
      title: lesson.title,
      objective: lesson.objective,
      durationMinutes: lesson.durationMinutes,
      order: lesson.order,
    }))
    .sort((left, right) => left.order - right.order);

  return {
    lessons: entries,
    publishedCount: entries.length,
    totalCount: INTERVIEW_FOUNDATIONS_TOTAL,
    totalMinutes: entries.reduce(
      (total, entry) => total + entry.durationMinutes,
      0,
    ),
    domains: [...new Set(entries.map((entry) => entry.domain))].sort(),
    isComplete: entries.length >= INTERVIEW_FOUNDATIONS_TOTAL,
  };
}

/** The learner-facing name of a domain. */
export function domainLabel(domain: CompiledLesson["domain"]): string {
  switch (domain) {
    case "dsa":
      return "DSA";
    case "networking":
      return "Networking";
    case "system-design":
      return "System Design";
  }
}
