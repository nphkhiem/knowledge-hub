import { expect, test } from "vitest";

import {
  arrivalsIn,
  serveFirstIn,
  serveLastIn,
  steadyStream,
} from "./first-in-order.js";

const LESSON = ["+report.pdf", "+photo.jpg", "-", "+notes.txt", "-", "-"];

test("everything that arrived is served in arrival order", () => {
  // The defining property, over several event sequences rather than one.
  const wrong = [
    ["+a", "-"],
    LESSON,
    ["+a", "+b", "+c", "-", "-", "-"],
    ["+a", "-", "+b", "-", "+c", "-"],
  ].filter(
    (events) =>
      JSON.stringify(serveFirstIn(events)) !==
      JSON.stringify(arrivalsIn(events)),
  );

  expect(wrong).toEqual([]);
});

test("the lesson's order", () => {
  expect(serveFirstIn(LESSON)).toEqual([
    "report.pdf",
    "photo.jpg",
    "notes.txt",
  ]);
});

test("a pile given the same events serves a different order", () => {
  // The contrast the two lessons exist to draw, on identical input.
  expect(serveLastIn(LESSON)).toEqual(["photo.jpg", "notes.txt", "report.pdf"]);
});

test("a late arrival does not overtake one already waiting", () => {
  // notes.txt arrives after photo.jpg is already waiting, and is served after
  // it. This is the step where the pile does the opposite.
  const served = serveFirstIn(LESSON);
  const piled = serveLastIn(LESSON);

  expect({
    pileServesTheNewerFirst:
      piled.indexOf("notes.txt") < piled.indexOf("report.pdf"),
    queueKeepsTheOrder:
      served.indexOf("photo.jpg") < served.indexOf("notes.txt"),
  }).toEqual({ pileServesTheNewerFirst: true, queueKeepsTheOrder: true });
});

test("a steady stream never starves the first arrival", () => {
  // Not "may be delayed": under alternating arrivals and services a pile never
  // serves the first item at all, for any number of rounds.
  const wrong = [1, 5, 50].filter((rounds) => {
    const events = steadyStream("first", rounds);
    return (
      !serveFirstIn(events).includes("first") ||
      serveLastIn(events).includes("first")
    );
  });

  expect(wrong).toEqual([]);
});

test("the first arrival is served immediately by a queue", () => {
  expect(serveFirstIn(steadyStream("first", 5))[0]).toBe("first");
});

test("serving an empty line does nothing", () => {
  expect([serveFirstIn(["-", "-"]), serveFirstIn(["-", "+a", "-"])]).toEqual([
    [],
    ["a"],
  ]);
});

test("unserved arrivals are simply not served", () => {
  expect(serveFirstIn(["+a", "+b", "-"])).toEqual(["a"]);
});

test("no events serve nobody", () => {
  expect([serveFirstIn([]), serveLastIn([])]).toEqual([[], []]);
});

test("repeated names are ordinary", () => {
  expect(serveFirstIn(["+job", "+job", "-", "-"])).toEqual(["job", "job"]);
});
