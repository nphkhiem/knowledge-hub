import type { SemanticSnapshot } from "@knowledge-hub/lesson-compiler";
import { currentComparison, relationPhrase } from "./scene.js";

/**
 * The concise screen-reader explanation of one semantic state. It states a sum
 * only while that sum still describes the addressed values, and otherwise falls
 * back to the step's authored narration.
 */
export function describeSnapshot(snapshot: SemanticSnapshot): string {
  const comparison = currentComparison(snapshot);

  /** Authored narration already describes its own step, so it stands alone. */
  if (comparison === undefined) return snapshot.narration;

  /** One probed value states itself. A pair has to state its sum as well. */
  const opening =
    comparison.rightLabel === undefined
      ? [
          `The ${comparison.leftLabel.toLowerCase()} pointer addresses`,
          ` ${comparison.leftValue}, ${relationPhrase(comparison.relation)}`,
          ` the target ${comparison.target}.`,
        ].join("")
      : [
          `Compare ${comparison.leftValue} at the ${comparison.leftLabel.toLowerCase()} pointer`,
          ` with ${comparison.rightValue} at the ${comparison.rightLabel.toLowerCase()} pointer.`,
          ` Their sum is ${comparison.actual}, ${relationPhrase(comparison.relation)}`,
          ` the target ${comparison.target}.`,
        ].join("");

  const result = snapshot.result;
  if (result === undefined) return opening;

  const outcome =
    result.kind === "found"
      ? `The pair at indices ${result.indices[0]} and ${result.indices[1]} sums to the target.`
      : "No pair sums to the target.";
  return `${opening} ${outcome}`;
}
