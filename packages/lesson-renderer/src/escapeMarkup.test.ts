import { expect, test } from "vitest";
import { escapeAttribute, escapeId, escapeText } from "./escapeMarkup.js";

test("escapes every character that could close or open markup in text", () => {
  expect(escapeText(`<g id="a" data-b='c'>5 & 6</g>`)).toBe(
    "&lt;g id=&quot;a&quot; data-b=&#39;c&#39;&gt;5 &amp; 6&lt;/g&gt;",
  );
});

test("escapes attribute values without double-escaping ampersands", () => {
  expect(escapeAttribute(`" onload="alert(1)`)).toBe(
    "&quot; onload=&quot;alert(1)",
  );
});

test("reduces identifiers to characters that are safe in a fragment target", () => {
  expect({
    hostile: escapeId('a" onmouseover="x'),
    spaced: escapeId("move right"),
    unicode: escapeId("étape-1"),
  }).toEqual({
    hostile: "a-onmouseover-x",
    spaced: "move-right",
    unicode: "-tape-1",
  });
});

test("leaves already safe text untouched", () => {
  expect({
    attribute: escapeAttribute("Sorted values"),
    identifier: escapeId("pair-found"),
    text: escapeText("Sum 16 is greater than target 15"),
  }).toEqual({
    attribute: "Sorted values",
    identifier: "pair-found",
    text: "Sum 16 is greater than target 15",
  });
});
