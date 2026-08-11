import type { CompiledLesson } from "@knowledge-hub/lesson-compiler";

import type { CollectionEntry } from "./collection.js";

type Domain = CompiledLesson["domain"];

/**
 * What each domain helps a developer understand.
 *
 * Editorial copy rather than data, because it describes the subject rather than
 * the lessons that happen to exist. A test asserts every domain the schema
 * allows has an entry, so a new domain cannot publish a blank introduction.
 */
export const DOMAIN_DEFINITIONS: Record<
  Domain,
  { readonly title: string; readonly definition: string }
> = {
  dsa: {
    title: "Data Structures and Algorithms",
    definition:
      "How data is arranged, and what that arrangement lets you avoid doing. These lessons are about recognizing which structure or traversal turns an expensive search into a cheap one, and what each choice costs in return.",
  },
  networking: {
    title: "Networking",
    definition:
      "What actually happens between a request and a response. These lessons trace the path a message takes and the delays it meets, so performance and failure stop being mysterious.",
  },
  "system-design": {
    title: "System Design",
    definition:
      "How independent pieces of a system cooperate under load. These lessons are about the trade-offs behind caching, balancing, queueing, and replication, and where each one stops working.",
  },
};

export interface DomainSummary {
  readonly domain: Domain;
  readonly title: string;
  readonly definition: string;
  readonly lessons: readonly CollectionEntry[];
  /** The recommended first lesson: the earliest in reading order. */
  readonly startHere: CollectionEntry;
  readonly totalMinutes: number;
}

/**
 * Groups published lessons by domain.
 *
 * A domain with no published lessons is omitted entirely rather than rendered
 * empty, so the site never routes to a page promising content it does not have.
 */
export function summarizeDomains(
  lessons: readonly CompiledLesson[],
): readonly DomainSummary[] {
  const byDomain = new Map<Domain, CollectionEntry[]>();

  for (const lesson of lessons) {
    const entry: CollectionEntry = {
      slug: lesson.slug,
      domain: lesson.domain,
      title: lesson.title,
      objective: lesson.objective,
      durationMinutes: lesson.durationMinutes,
      order: lesson.order,
    };
    const existing = byDomain.get(lesson.domain);
    if (existing === undefined) byDomain.set(lesson.domain, [entry]);
    else existing.push(entry);
  }

  const summaries: DomainSummary[] = [];
  for (const [domain, entries] of byDomain) {
    const ordered = [...entries].sort(
      (left, right) => left.order - right.order,
    );
    const startHere = ordered[0];
    if (startHere === undefined) continue;

    summaries.push({
      domain,
      title: DOMAIN_DEFINITIONS[domain].title,
      definition: DOMAIN_DEFINITIONS[domain].definition,
      lessons: ordered,
      startHere,
      totalMinutes: ordered.reduce(
        (total, entry) => total + entry.durationMinutes,
        0,
      ),
    });
  }

  return summaries.sort((left, right) =>
    left.domain.localeCompare(right.domain),
  );
}
