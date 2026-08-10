import { expect, test } from "vitest";
import { serializeForHtml } from "./serializeForHtml";

test("neutralizes characters that could end the surrounding script element", () => {
  const hostile = "</script><script>x</script>";
  const serialized = serializeForHtml({ narration: hostile });

  expect({
    closesScript: serialized.includes("</script>"),
    hasAngleBrackets: /[<>]/.test(serialized),
    roundTrips: JSON.parse(serialized) as unknown,
  }).toEqual({
    closesScript: false,
    hasAngleBrackets: false,
    roundTrips: { narration: hostile },
  });
});

test("escapes ampersands and the separators that break inline scripts", () => {
  const text = ["a & b", "\u2028", "c", "\u2029", "d"].join(" ");
  const serialized = serializeForHtml({ text });

  expect({
    ampersand: serialized.includes("&"),
    lineSeparator: serialized.includes("\u2028"),
    paragraphSeparator: serialized.includes("\u2029"),
    roundTrips: JSON.parse(serialized) as unknown,
  }).toEqual({
    ampersand: false,
    lineSeparator: false,
    paragraphSeparator: false,
    roundTrips: { text },
  });
});

test("round trips a nested structure unchanged", () => {
  const value = { nested: [1, "two", null, { deep: true }] };

  expect(JSON.parse(serializeForHtml(value)) as unknown).toEqual(value);
});
