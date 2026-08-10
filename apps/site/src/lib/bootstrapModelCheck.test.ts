import { compiledTwoPointersLesson } from "@knowledge-hub/lesson-testing";
import { afterEach, expect, test } from "vitest";
import { bootstrapModelCheck } from "./bootstrapModelCheck";

function createPage(dataText: string | undefined): HTMLElement {
  const root = document.createElement("div");
  root.dataset.modelCheck = "";
  root.innerHTML = [
    "<fieldset><legend>Which pointer should move?</legend>",
    '<label><input type="radio" name="model-check" value="move-right" data-model-option></label>',
    "</fieldset>",
    '<button type="button" data-model-submit hidden disabled>Check my model</button>',
    "<div data-model-explanation hidden><p data-model-verdict></p></div>",
  ].join("");
  document.body.append(root);

  if (dataText !== undefined) {
    const data = document.createElement("script");
    data.type = "application/json";
    data.dataset.compiledLesson = "";
    data.textContent = dataText;
    document.body.append(data);
  }
  return root;
}

afterEach(() => {
  document.body.innerHTML = "";
});

test("mounts when the page carries a sound compiled lesson", () => {
  const root = createPage(JSON.stringify(compiledTwoPointersLesson));

  const release = bootstrapModelCheck(root);

  expect({
    buttonRevealed: !root.querySelector<HTMLElement>("[data-model-submit]")
      ?.hidden,
    mounted: release !== undefined,
  }).toEqual({ buttonRevealed: true, mounted: true });

  release?.();
});

test("leaves the question readable and the button hidden when data is unusable", () => {
  const cases: (string | undefined)[] = [
    undefined,
    "",
    "{invalid json",
    "null",
    '{"modelCheck":{}}',
  ];

  const outcomes = cases.map((text) => {
    document.body.innerHTML = "";
    const root = createPage(text);
    let threw = false;
    let mounted = false;
    try {
      mounted = bootstrapModelCheck(root) !== undefined;
    } catch {
      threw = true;
    }
    return {
      buttonHidden: root.querySelector<HTMLElement>("[data-model-submit]")
        ?.hidden,
      legendReadable:
        (root.querySelector("legend")?.textContent ?? "").length > 0,
      mounted,
      threw,
    };
  });

  expect(outcomes).toEqual(
    cases.map(() => ({
      buttonHidden: true,
      legendReadable: true,
      mounted: false,
      threw: false,
    })),
  );
});
