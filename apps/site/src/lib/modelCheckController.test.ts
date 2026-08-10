import { compiledTwoPointersLesson } from "@knowledge-hub/lesson-testing";
import { afterEach, expect, test } from "vitest";
import { mountModelCheck } from "./modelCheckController";

const { modelCheck } = compiledTwoPointersLesson;
let release: (() => void) | undefined;

/** Mirrors what ModelCheck.astro prerenders, including the hidden feedback. */
function createModelCheckFixture(): HTMLElement {
  const root = document.createElement("div");
  root.dataset.modelCheck = "";
  root.innerHTML = [
    "<fieldset><legend>" + modelCheck.prompt + "</legend>",
    ...modelCheck.options.map(
      (option) =>
        `<label><input type="radio" name="model-check" value="${option.id}" data-model-option> ${option.label}</label>`,
    ),
    "</fieldset>",
    '<button type="button" data-model-submit hidden disabled>Check my model</button>',
    '<div data-model-explanation aria-live="polite" hidden>',
    "<p data-model-verdict></p>",
    `<p data-model-reason>${modelCheck.explanation}</p>`,
    "</div>",
  ].join("");
  document.body.append(root);
  return root;
}

function option(root: HTMLElement, id: string): HTMLInputElement {
  const input = root.querySelector(`[data-model-option][value="${id}"]`);
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`The fixture has no ${id} option.`);
  }
  return input;
}

function submit(root: HTMLElement): HTMLButtonElement {
  const button = root.querySelector("[data-model-submit]");
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("The fixture has no submit button.");
  }
  return button;
}

function explanation(root: HTMLElement): HTMLElement {
  const region = root.querySelector("[data-model-explanation]");
  if (!(region instanceof HTMLElement)) {
    throw new Error("The fixture has no explanation region.");
  }
  return region;
}

function choose(root: HTMLElement, id: string): void {
  const input = option(root, id);
  input.checked = true;
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function mount(): HTMLElement {
  const root = createModelCheckFixture();
  release = mountModelCheck(root, compiledTwoPointersLesson);
  return root;
}

afterEach(() => {
  release?.();
  release = undefined;
  document.body.innerHTML = "";
});

test("reveals the explanation only after the learner asks for it", () => {
  const root = mount();

  const beforeChoice = {
    disabled: submit(root).disabled,
    revealed: !explanation(root).hidden,
  };
  choose(root, "move-right");
  const afterChoice = {
    disabled: submit(root).disabled,
    revealed: !explanation(root).hidden,
  };
  submit(root).click();

  expect({
    afterChoice,
    beforeChoice,
    reason: root.querySelector("[data-model-reason]")?.textContent,
    revealedAtEnd: !explanation(root).hidden,
  }).toEqual({
    afterChoice: { disabled: false, revealed: false },
    beforeChoice: { disabled: true, revealed: false },
    reason: modelCheck.explanation,
    revealedAtEnd: true,
  });
});

test("says which move the lesson teaches without keeping a score", () => {
  const root = mount();
  choose(root, "move-left");
  submit(root).click();
  const afterWrongChoice = root
    .querySelector("[data-model-verdict]")
    ?.textContent?.trim();

  choose(root, "move-right");
  submit(root).click();
  const afterTaughtChoice = root
    .querySelector("[data-model-verdict]")
    ?.textContent?.trim();

  expect({
    afterTaughtChoice,
    afterWrongChoice,
    differs: afterWrongChoice !== afterTaughtChoice,
    gamified: /score|streak|points|correct answers|badge|level/i.test(
      root.textContent ?? "",
    ),
  }).toEqual({
    afterTaughtChoice: "That is the move this lesson teaches.",
    afterWrongChoice: "This lesson moves a different pointer.",
    differs: true,
    gamified: false,
  });
});

test("lets the learner change their mind and ask again", () => {
  const root = mount();
  choose(root, "move-both");
  submit(root).click();
  const first = !explanation(root).hidden;

  choose(root, "move-right");
  const afterChangingMind = !explanation(root).hidden;
  submit(root).click();

  expect({
    afterChangingMind,
    first,
    reopened: !explanation(root).hidden,
  }).toEqual({ afterChangingMind: false, first: true, reopened: true });
});

test("keeps the polite region only on the feedback the learner triggered", () => {
  const root = mount();

  expect({
    liveRegions: [...root.querySelectorAll("[aria-live]")].map((element) => ({
      politeness: element.getAttribute("aria-live"),
      target: element.getAttribute("data-model-explanation") === "",
    })),
  }).toEqual({ liveRegions: [{ politeness: "polite", target: true }] });
});

test("reveals the button on mount so it is never dead without scripting", () => {
  const root = createModelCheckFixture();
  const beforeMount = submit(root).hidden;

  release = mountModelCheck(root, compiledTwoPointersLesson);

  expect({ afterMount: submit(root).hidden, beforeMount }).toEqual({
    afterMount: false,
    beforeMount: true,
  });
});

test("persists nothing and detaches cleanly", () => {
  const root = mount();
  choose(root, "move-right");
  submit(root).click();

  release?.();
  release = undefined;
  choose(root, "move-left");
  submit(root).click();

  expect({
    storageTouched: Object.keys({ ...localStorage }).length,
    verdictFrozen: root
      .querySelector("[data-model-verdict]")
      ?.textContent?.trim(),
  }).toEqual({
    storageTouched: 0,
    verdictFrozen: "That is the move this lesson teaches.",
  });
});
