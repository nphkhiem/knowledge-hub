function deepFreeze(value: unknown): void {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return;
  }
  for (const nestedValue of Object.values(value)) deepFreeze(nestedValue);
  Object.freeze(value);
}

const validTwoPointersSourceValue = {
  schemaVersion: 1,
  id: "dsa.two-pointers",
  slug: "two-pointers",
  domain: "dsa",
  collection: "interview-foundations",
  order: 2,
  license: "CC-BY-4.0",
  title: "Two Pointers",
  durationMinutes: 4,
  objective:
    "Explain how two coordinated positions discard impossible candidates.",
  recognitionSignals: ["The data has a useful order."],
  limitations: ["Pointer moves require a proven invariant."],
  content: {
    quickUnderstanding: "quick-understanding.md",
    realWorldApplications: "real-world-applications.md",
    deepDive: "deep-dive.md",
  },
  scene: {
    target: 15,
    objects: [
      {
        id: "values",
        kind: "array",
        label: "Sorted values",
        values: [1, 2, 4, 7, 11, 15],
      },
      {
        id: "left-pointer",
        kind: "pointer",
        label: "Left",
        targetObjectId: "values",
        index: 0,
      },
      {
        id: "target-label",
        kind: "label",
        text: "Target 15",
      },
      {
        id: "pair-comparison",
        kind: "comparison",
        arrayObjectId: "values",
        leftPointerId: "left-pointer",
        rightPointerId: "left-pointer",
        target: 15,
      },
      { id: "pair-result", kind: "result", status: "pending" },
    ],
  },
  timeline: [
    {
      id: "pair-found",
      narration: "The pointers found the matching pair.",
      terminal: true,
      actions: [
        {
          type: "set",
          objectId: "pair-result",
          property: "status",
          value: "found",
        },
      ],
    },
  ],
  modelCheck: {
    prompt: "Which pointer moves when the sum is too large?",
    options: [
      { id: "right", label: "The right pointer" },
      { id: "left", label: "The left pointer" },
    ],
    correctOptionId: "right",
    explanation: "Moving right leftwards decreases the sum.",
  },
  accessibility: {
    summary: "Two pointers move inward across a sorted array.",
    initialDescription: "Pointers begin at opposite ends of the array.",
    motionEquivalentLabel: "Two Pointers step-by-step explanation",
  },
  evidence: {
    verifiedOn: "2026-08-09",
    scope: "Ascending arrays with a pair-sum target.",
    sources: [
      {
        title: "Sorting and Searching — Two sum to x",
        url: "https://introcs.cs.princeton.edu/java/42sort/",
        publisher: "Princeton University",
        accessedOn: "2026-08-09",
        supports: ["A sorted two-sum instance can be solved in linear time."],
      },
    ],
  },
} as const;

deepFreeze(validTwoPointersSourceValue);

export const validTwoPointersSource = validTwoPointersSourceValue;
