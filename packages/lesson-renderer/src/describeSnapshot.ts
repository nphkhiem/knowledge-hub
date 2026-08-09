import type { SemanticSnapshot } from "@knowledge-hub/lesson-compiler";
import { currentComparison, relationPhrase } from "./scene.js";

/**
 * The concise screen-reader explanation of one semantic state. It states a sum
 * only while that sum still describes the addressed values, and otherwise falls
 * back to the step's authored narration.
 */
export function describeSnapshot(snapshot: SemanticSnapshot): string {
  const comparison = currentComparison(snapshot);
  const opening =
    comparison === undefined
      ? snapshot.narration
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
