export const RESULT_STATUSES = ["pending", "found", "not-found"] as const;

export type ResultStatus = (typeof RESULT_STATUSES)[number];

const resultStatusValues: ReadonlySet<unknown> = new Set(RESULT_STATUSES);

export function isResultStatus(value: unknown): value is ResultStatus {
  return typeof value === "string" && resultStatusValues.has(value);
}
