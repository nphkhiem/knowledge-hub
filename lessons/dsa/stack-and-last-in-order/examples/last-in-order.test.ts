import { expect, test } from "vitest";

import { deepestNesting, drain, isBalanced } from "./last-in-order.js";

const WORK = ["render page", "lay out list", "measure row"];

test("what comes out is what went in, reversed", () => {
  // The defining property, over many inputs rather than one. A structure that
  // failed this would not be a stack whatever its methods were named.
  const wrong = [
    [],
    ["only"],
    WORK,
    [..."abcdef"],
    ["same", "same", "same"],
  ].filter(
    (items) =>
      JSON.stringify(drain(items)) !== JSON.stringify([...items].reverse()),
  );

  expect(wrong).toEqual([]);
});

test("the lesson's order", () => {
  expect(drain(WORK)).toEqual(["measure row", "lay out list", "render page"]);
});

test("draining twice restores the original order", () => {
  expect(drain(drain(WORK))).toEqual(WORK);
});

test("balanced nesting is accepted", () => {
  const rejected = ["", "()", "([{}])", "a(b)c[d]e", "(())()"].filter(
    (text) => !isBalanced(text),
  );

  expect(rejected).toEqual([]);
});

test("a closer with nothing open is rejected", () => {
  expect([isBalanced(")"), isBalanced("())")]).toEqual([false, false]);
});

test("something left open is rejected", () => {
  expect([isBalanced("("), isBalanced("([)")]).toEqual([false, false]);
});

test("the wrong closer is rejected", () => {
  // The case a counter of opens and closes cannot detect: the counts match and
  // the nesting is still wrong.
  const opens = [..."([)]"].filter((c) => "([".includes(c)).length;
  const closes = [..."([)]"].filter((c) => ")]".includes(c)).length;

  expect({ balanced: isBalanced("([)]"), closes, opens }).toEqual({
    balanced: false,
    closes: 2,
    opens: 2,
  });
});

test("depth grows with nesting, not with length", () => {
  // A thousand pairs in sequence never need more than one slot; ten nested need
  // ten. This is why recursion depth is the thing to reason about.
  expect({
    nested: deepestNesting("(".repeat(10) + ")".repeat(10)),
    sequential: deepestNesting("()".repeat(1000)),
  }).toEqual({ nested: 10, sequential: 1 });
});

test("text without brackets is balanced and flat", () => {
  expect({
    balanced: isBalanced("no brackets here"),
    depth: deepestNesting("no brackets here"),
  }).toEqual({ balanced: true, depth: 0 });
});
