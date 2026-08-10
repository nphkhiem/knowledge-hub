import { expect, test } from "vitest";
import { validTwoPointersSource } from "./index.js";

function isDeeplyFrozen(value: unknown): boolean {
  if (typeof value !== "object" || value === null) return true;
  return Object.isFrozen(value) && Object.values(value).every(isDeeplyFrozen);
}

test("publishes a deeply immutable source fixture through the testing package", () => {
  expect({
    deeplyFrozen: isDeeplyFrozen(validTwoPointersSource),
    identity: {
      domain: validTwoPointersSource.domain,
      id: validTwoPointersSource.id,
      slug: validTwoPointersSource.slug,
    },
  }).toEqual({
    deeplyFrozen: true,
    identity: {
      domain: "dsa",
      id: "dsa.two-pointers",
      slug: "two-pointers",
    },
  });
});
