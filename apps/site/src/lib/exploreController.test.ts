import { expect, test } from "vitest";

import { mountExplore, type ExploreElements } from "./exploreController.js";
import type { SearchRecord } from "./search.js";

const records: SearchRecord[] = [
  {
    slug: "two-pointers",
    difficulty: "easy",
    domain: "dsa",
    collection: "interview-foundations",
    order: 2,
    title: "Two Pointers",
    objective: "Discard impossible candidates.",
    durationMinutes: 4,
    terms: ["sorted", "pair sum"],
  },
  {
    slug: "url-to-response",
    difficulty: "easy",
    domain: "networking",
    collection: "interview-foundations",
    order: 8,
    title: "URL to Response",
    objective: "Follow a request from DNS onwards.",
    durationMinutes: 6,
    terms: ["dns"],
  },
];

function render(): {
  elements: ExploreElements;
  written: string[];
  location: { value: string };
} {
  document.body.innerHTML = `
    <form action="/explore/" id="f">
      <input id="q" name="q" />
      <select id="d" name="domain">
        <option value=""></option>
        <option value="dsa">DSA</option>
        <option value="networking">Networking</option>
      </select>
    </form>
    <p id="summary"></p>
    <ol id="results">
      <li data-lesson-slug="two-pointers">Two Pointers</li>
      <li data-lesson-slug="url-to-response">URL to Response</li>
    </ol>
    <p id="empty" hidden>Nothing found</p>
  `;

  const elements: ExploreElements = {
    form: document.querySelector("#f") as HTMLFormElement,
    queryInput: document.querySelector("#q") as HTMLInputElement,
    domainSelect: document.querySelector("#d") as HTMLSelectElement,
    summary: document.querySelector("#summary") as HTMLElement,
    results: document.querySelector("#results") as HTMLElement,
    empty: document.querySelector("#empty") as HTMLElement,
  };

  const written: string[] = [];
  const location = { value: "https://example.test/explore/" };
  mountExplore(elements, records, {
    readLocation: () => location.value,
    writeLocation: (url) => written.push(url),
  });

  return { elements, written, location };
}

function visibleSlugs(): string[] {
  return [...document.querySelectorAll<HTMLElement>("[data-lesson-slug]")]
    .filter((row) => !row.hidden)
    .map((row) => row.dataset["lessonSlug"] ?? "");
}

test("shows the whole catalog before anything is asked", () => {
  render();

  expect({
    visible: visibleSlugs(),
    summary: document.querySelector("#summary")?.textContent,
  }).toEqual({
    visible: ["two-pointers", "url-to-response"],
    summary: "Showing all 2 lessons.",
  });
});

test("narrows to the lessons matching what was typed", () => {
  const { elements } = render();

  elements.queryInput.value = "dns";
  elements.queryInput.dispatchEvent(new Event("input"));

  expect(visibleSlugs()).toEqual(["url-to-response"]);
});

test("narrows by domain", () => {
  const { elements } = render();

  elements.domainSelect.value = "dsa";
  elements.domainSelect.dispatchEvent(new Event("change"));

  expect(visibleSlugs()).toEqual(["two-pointers"]);
});

test("keeps the address shareable as filters change", () => {
  const { elements, written } = render();

  elements.queryInput.value = "dns";
  elements.queryInput.dispatchEvent(new Event("input"));

  expect(written.at(-1)).toBe("/explore/?q=dns");
});

test("adopts filters carried by the address it was opened with", () => {
  document.body.innerHTML = "";
  const location = { value: "https://example.test/explore/?domain=networking" };
  document.body.innerHTML = `
    <form action="/explore/" id="f"><input id="q" /><select id="d"><option value=""></option><option value="networking">N</option></select></form>
    <p id="summary"></p>
    <ol id="results">
      <li data-lesson-slug="two-pointers"></li>
      <li data-lesson-slug="url-to-response"></li>
    </ol>
    <p id="empty" hidden></p>`;

  mountExplore(
    {
      form: document.querySelector("#f") as HTMLFormElement,
      queryInput: document.querySelector("#q") as HTMLInputElement,
      domainSelect: document.querySelector("#d") as HTMLSelectElement,
      summary: document.querySelector("#summary") as HTMLElement,
      results: document.querySelector("#results") as HTMLElement,
      empty: document.querySelector("#empty") as HTMLElement,
    },
    records,
    { readLocation: () => location.value, writeLocation: () => {} },
  );

  expect(visibleSlugs()).toEqual(["url-to-response"]);
});

test("explains an empty result instead of showing a blank list", () => {
  const { elements } = render();

  elements.queryInput.value = "kubernetes";
  elements.queryInput.dispatchEvent(new Event("input"));

  expect({
    visible: visibleSlugs(),
    emptyHidden: (document.querySelector("#empty") as HTMLElement).hidden,
    summary: document.querySelector("#summary")?.textContent,
  }).toEqual({
    visible: [],
    emptyHidden: false,
    summary: 'No lessons matching "kubernetes".',
  });
});

test("recovers the full catalog when the query is cleared", () => {
  const { elements } = render();

  elements.queryInput.value = "kubernetes";
  elements.queryInput.dispatchEvent(new Event("input"));
  elements.queryInput.value = "";
  elements.queryInput.dispatchEvent(new Event("input"));

  expect(visibleSlugs()).toEqual(["two-pointers", "url-to-response"]);
});

test("does not navigate when the form is submitted", () => {
  const { elements } = render();
  const submit = new Event("submit", { cancelable: true });

  elements.form.dispatchEvent(submit);

  expect(submit.defaultPrevented).toBe(true);
});
