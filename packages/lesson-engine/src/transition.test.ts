import { expect, test } from "vitest";
import { compiledTwoPointersLesson } from "@knowledge-hub/lesson-testing";
import { createInitialEngineState, transition } from "./index.js";

test("creates the idle state at the first lesson snapshot", () => {
  expect(createInitialEngineState(compiledTwoPointersLesson)).toEqual({
    lessonId: "dsa.two-pointers",
    stepIndex: 0,
    status: "idle",
    modelCheck: {
      selectedOptionId: null,
      explanationRevealed: false,
    },
  });
});

test("play returns a fresh deeply frozen playing state", () => {
  const initial = createInitialEngineState(compiledTwoPointersLesson);

  const playing = transition(compiledTwoPointersLesson, initial, {
    type: "play",
  });

  expect({
    deeplyFrozen:
      Object.isFrozen(playing) && Object.isFrozen(playing.modelCheck),
    fresh: playing !== initial,
    state: playing,
  }).toEqual({
    deeplyFrozen: true,
    fresh: true,
    state: {
      ...initial,
      status: "playing",
    },
  });
});

test("play returns the unchanged state reference when already playing", () => {
  const initial = createInitialEngineState(compiledTwoPointersLesson);
  const playing = transition(compiledTwoPointersLesson, initial, {
    type: "play",
  });

  expect(transition(compiledTwoPointersLesson, playing, { type: "play" })).toBe(
    playing,
  );
});

test("returns the unchanged state when lesson identity does not match", () => {
  const initial = createInitialEngineState(compiledTwoPointersLesson);
  const otherLesson = {
    ...compiledTwoPointersLesson,
    id: "dsa.other-lesson",
  };

  expect(transition(otherLesson, initial, { type: "play" })).toBe(initial);
});

test("completed terminal state absorbs pause, play, and next in sequence", () => {
  let state = transition(
    compiledTwoPointersLesson,
    createInitialEngineState(compiledTwoPointersLesson),
    { type: "play" },
  );
  for (
    let stepIndex = 1;
    stepIndex < compiledTwoPointersLesson.snapshots.length;
    stepIndex += 1
  ) {
    state = transition(compiledTwoPointersLesson, state, { type: "next" });
  }

  const paused = transition(compiledTwoPointersLesson, state, {
    type: "pause",
  });
  const played = transition(compiledTwoPointersLesson, paused, {
    type: "play",
  });
  const next = transition(compiledTwoPointersLesson, played, {
    type: "next",
  });

  expect({
    pauseKeepsCompletedReference: paused === state,
    playKeepsCompletedReference: played === state,
    nextKeepsCompletedReference: next === state,
    state: next,
  }).toEqual({
    pauseKeepsCompletedReference: true,
    playKeepsCompletedReference: true,
    nextKeepsCompletedReference: true,
    state,
  });
});

test("previous leaves completion and moves to a deeply frozen paused state", () => {
  let state = createInitialEngineState(compiledTwoPointersLesson);
  for (
    let stepIndex = 1;
    stepIndex < compiledTwoPointersLesson.snapshots.length;
    stepIndex += 1
  ) {
    state = transition(compiledTwoPointersLesson, state, { type: "next" });
  }

  const previous = transition(compiledTwoPointersLesson, state, {
    type: "previous",
  });

  expect({
    deeplyFrozen:
      Object.isFrozen(previous) && Object.isFrozen(previous.modelCheck),
    fresh: previous !== state,
    state: previous,
  }).toEqual({
    deeplyFrozen: true,
    fresh: true,
    state: {
      ...state,
      stepIndex: compiledTwoPointersLesson.snapshots.length - 2,
      status: "paused",
    },
  });
});

test("seek leaves completion as paused and restores completion at terminal", () => {
  const initial = createInitialEngineState(compiledTwoPointersLesson);
  const terminalStepIndex = compiledTwoPointersLesson.snapshots.length - 1;
  const completed = transition(compiledTwoPointersLesson, initial, {
    type: "seek",
    stepIndex: terminalStepIndex,
  });

  const escaped = transition(compiledTwoPointersLesson, completed, {
    type: "seek",
    stepIndex: 3,
  });
  const returned = transition(compiledTwoPointersLesson, escaped, {
    type: "seek",
    stepIndex: terminalStepIndex,
  });
  const repeated = transition(compiledTwoPointersLesson, returned, {
    type: "seek",
    stepIndex: terminalStepIndex,
  });

  expect({
    escaped,
    repeatedKeepsCompletedReference: repeated === returned,
    returned,
  }).toEqual({
    escaped: { ...completed, stepIndex: 3, status: "paused" },
    repeatedKeepsCompletedReference: true,
    returned: completed,
  });
});

test("restart plays from the beginning and resets the Model Check", () => {
  const completedWithAnswer = Object.freeze({
    lessonId: compiledTwoPointersLesson.id,
    stepIndex: compiledTwoPointersLesson.snapshots.length - 1,
    status: "completed" as const,
    modelCheck: Object.freeze({
      selectedOptionId: "move-right",
      explanationRevealed: true,
    }),
  });

  const restarted = transition(compiledTwoPointersLesson, completedWithAnswer, {
    type: "restart",
  });

  expect({
    deeplyFrozen:
      Object.isFrozen(restarted) && Object.isFrozen(restarted.modelCheck),
    fresh: restarted !== completedWithAnswer,
    state: restarted,
  }).toEqual({
    deeplyFrozen: true,
    fresh: true,
    state: {
      lessonId: "dsa.two-pointers",
      stepIndex: 0,
      status: "playing",
      modelCheck: {
        selectedOptionId: null,
        explanationRevealed: false,
      },
    },
  });
});

test("restart returns an already reset playing state unchanged", () => {
  const initial = createInitialEngineState(compiledTwoPointersLesson);
  const playing = transition(compiledTwoPointersLesson, initial, {
    type: "play",
  });

  expect(
    transition(compiledTwoPointersLesson, playing, { type: "restart" }),
  ).toBe(playing);
});

test("answer selects a known option without revealing its explanation", () => {
  const initial = createInitialEngineState(compiledTwoPointersLesson);

  const selected = transition(compiledTwoPointersLesson, initial, {
    type: "answer",
    optionId: "move-right",
    revealExplanation: false,
  });

  expect({
    deeplyFrozen:
      Object.isFrozen(selected) && Object.isFrozen(selected.modelCheck),
    fresh: selected !== initial,
    modelCheck: selected.modelCheck,
  }).toEqual({
    deeplyFrozen: true,
    fresh: true,
    modelCheck: {
      selectedOptionId: "move-right",
      explanationRevealed: false,
    },
  });
});

test("answer reveals the explanation for the already selected option", () => {
  const initial = createInitialEngineState(compiledTwoPointersLesson);
  const selected = transition(compiledTwoPointersLesson, initial, {
    type: "answer",
    optionId: "move-right",
    revealExplanation: false,
  });

  const revealed = transition(compiledTwoPointersLesson, selected, {
    type: "answer",
    optionId: "move-right",
    revealExplanation: true,
  });

  expect(revealed.modelCheck).toEqual({
    selectedOptionId: "move-right",
    explanationRevealed: true,
  });
});

test("answer hides explanation when selection changes and repeats as a no-op", () => {
  const selected = transition(
    compiledTwoPointersLesson,
    createInitialEngineState(compiledTwoPointersLesson),
    {
      type: "answer",
      optionId: "move-right",
      revealExplanation: false,
    },
  );
  const revealed = transition(compiledTwoPointersLesson, selected, {
    type: "answer",
    optionId: "move-right",
    revealExplanation: true,
  });

  const changed = transition(compiledTwoPointersLesson, revealed, {
    type: "answer",
    optionId: "move-left",
    revealExplanation: true,
  });
  const repeated = transition(compiledTwoPointersLesson, changed, {
    type: "answer",
    optionId: "move-left",
    revealExplanation: false,
  });

  expect({
    modelCheck: changed.modelCheck,
    repeatedKeepsReference: repeated === changed,
  }).toEqual({
    modelCheck: {
      selectedOptionId: "move-left",
      explanationRevealed: false,
    },
    repeatedKeepsReference: true,
  });
});
