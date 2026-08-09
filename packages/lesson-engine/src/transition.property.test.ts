import { fc, test } from "@fast-check/vitest";
import { expect } from "vitest";
import { compiledTwoPointersLesson } from "@knowledge-hub/lesson-testing";
import {
  createInitialEngineState,
  transition,
  type EngineCommand,
  type EngineState,
} from "./index.js";

const knownOptionIds = compiledTwoPointersLesson.modelCheck.options.map(
  (option) => option.id,
);
const knownOptionIdArbitrary = fc.constantFrom(...knownOptionIds);
const unknownOptionIdArbitrary = fc
  .string({ minLength: 1, maxLength: 40 })
  .filter((optionId) => !knownOptionIds.includes(optionId));
const invalidSeekStepArbitrary = fc.oneof(
  fc.constantFrom(
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ),
  fc.integer({ min: -500, max: 500 }).map((value) => value + 0.5),
);
const seekStepArbitrary = fc.oneof(
  fc.integer({ min: -500, max: 500 }),
  invalidSeekStepArbitrary,
);

const engineCommandArbitrary: fc.Arbitrary<EngineCommand> = fc.oneof(
  fc.constant({ type: "play" as const }),
  fc.constant({ type: "pause" as const }),
  fc.constant({ type: "restart" as const }),
  fc.constant({ type: "next" as const }),
  fc.constant({ type: "previous" as const }),
  fc.record({
    type: fc.constant("seek" as const),
    stepIndex: seekStepArbitrary,
  }),
  fc.record({
    type: fc.constant("answer" as const),
    optionId: fc.oneof(knownOptionIdArbitrary, unknownOptionIdArbitrary),
    revealExplanation: fc.boolean(),
  }),
);
const commandSequenceArbitrary = fc.array(engineCommandArbitrary, {
  maxLength: 200,
});

function replay(commands: readonly EngineCommand[]): EngineState {
  return commands.reduce(
    (state, command) => transition(compiledTwoPointersLesson, state, command),
    createInitialEngineState(compiledTwoPointersLesson),
  );
}

function replayStates(
  commands: readonly EngineCommand[],
): readonly EngineState[] {
  let state = createInitialEngineState(compiledTwoPointersLesson);
  const states = [state];
  for (const command of commands) {
    state = transition(compiledTwoPointersLesson, state, command);
    states.push(state);
  }
  return states;
}

test.prop(
  [
    fc.integer({
      min: 0,
      max: compiledTwoPointersLesson.snapshots.length - 2,
    }),
    fc.option(knownOptionIdArbitrary, { nil: null }),
  ],
  { seed: 40_304_001 },
)(
  "pause preserves generated input states without mutating them",
  (stepIndex, selectedOptionId) => {
    const input: EngineState = {
      lessonId: compiledTwoPointersLesson.id,
      stepIndex,
      status: "playing",
      modelCheck: {
        selectedOptionId,
        explanationRevealed: false,
      },
    };
    const before = structuredClone(input);

    const paused = transition(compiledTwoPointersLesson, input, {
      type: "pause",
    });

    expect({ input, paused }).toEqual({
      input: before,
      paused: { ...before, status: "paused" },
    });
  },
);

test.prop([commandSequenceArbitrary], { seed: 40_304_002 })(
  "replays arbitrary command sequences deterministically",
  (commands) => {
    expect(JSON.stringify(replay(commands))).toBe(
      JSON.stringify(replay(commands)),
    );
  },
);

test.prop([commandSequenceArbitrary], { seed: 40_304_003 })(
  "keeps arbitrary command sequences within one coherent lesson",
  (commands) => {
    const states = replayStates(commands);
    const lastStepIndex = compiledTwoPointersLesson.snapshots.length - 1;

    expect(
      states.every((state) => {
        const terminal =
          compiledTwoPointersLesson.snapshots[state.stepIndex]?.terminal ===
          true;
        return (
          Object.isFrozen(state) &&
          Object.isFrozen(state.modelCheck) &&
          state.lessonId === compiledTwoPointersLesson.id &&
          state.stepIndex >= 0 &&
          state.stepIndex <= lastStepIndex &&
          (terminal
            ? state.status === "completed"
            : state.status !== "completed")
        );
      }),
    ).toBe(true);
  },
);

test.prop([commandSequenceArbitrary], { seed: 40_304_004 })(
  "does not mutate any input state across arbitrary command sequences",
  (commands) => {
    let state = createInitialEngineState(compiledTwoPointersLesson);
    let everyInputWasPreserved = true;

    for (const command of commands) {
      const input = structuredClone(state);
      const before = structuredClone(input);
      state = transition(compiledTwoPointersLesson, input, command);
      everyInputWasPreserved &&=
        JSON.stringify(input) === JSON.stringify(before);
    }

    expect(everyInputWasPreserved).toBe(true);
  },
);

test.prop(
  [fc.constantFrom("idle" as const, "playing" as const, "paused" as const)],
  { seed: 40_304_005 },
)(
  "previous at the first snapshot returns every valid state unchanged",
  (status) => {
    const state: EngineState = Object.freeze({
      lessonId: compiledTwoPointersLesson.id,
      stepIndex: 0,
      status,
      modelCheck: Object.freeze({
        selectedOptionId: null,
        explanationRevealed: false,
      }),
    });

    expect(
      transition(compiledTwoPointersLesson, state, { type: "previous" }),
    ).toBe(state);
  },
);

test.prop([fc.integer({ min: -500, max: 500 })], { seed: 40_304_006 })(
  "seek clamps integer indices without leaving the lesson range or identity",
  (requestedStep) => {
    const initial = createInitialEngineState(compiledTwoPointersLesson);
    const lastStepIndex = compiledTwoPointersLesson.snapshots.length - 1;
    const expectedStepIndex = Math.max(
      0,
      Math.min(requestedStep, lastStepIndex),
    );

    const sought = transition(compiledTwoPointersLesson, initial, {
      type: "seek",
      stepIndex: requestedStep,
    });

    expect({
      identity: sought.lessonId,
      inRange: sought.stepIndex >= 0 && sought.stepIndex <= lastStepIndex,
      state: sought,
      unchangedWhenClampedToCurrent:
        expectedStepIndex === initial.stepIndex ? sought === initial : true,
    }).toEqual({
      identity: compiledTwoPointersLesson.id,
      inRange: true,
      state: {
        ...initial,
        stepIndex: expectedStepIndex,
        status: expectedStepIndex === lastStepIndex ? "completed" : "idle",
      },
      unchangedWhenClampedToCurrent: true,
    });
  },
);

test.prop([invalidSeekStepArbitrary], { seed: 40_304_007 })(
  "seek rejects non-finite and fractional indices unchanged",
  (stepIndex) => {
    const initial = createInitialEngineState(compiledTwoPointersLesson);

    expect(
      transition(compiledTwoPointersLesson, initial, {
        type: "seek",
        stepIndex,
      }),
    ).toBe(initial);
  },
);

test.prop([unknownOptionIdArbitrary, fc.boolean()], { seed: 40_304_008 })(
  "answer rejects unknown option identifiers unchanged",
  (optionId, revealExplanation) => {
    const initial = createInitialEngineState(compiledTwoPointersLesson);

    expect(
      transition(compiledTwoPointersLesson, initial, {
        type: "answer",
        optionId,
        revealExplanation,
      }),
    ).toBe(initial);
  },
);

test.prop([commandSequenceArbitrary], { seed: 40_304_009 })(
  "restart canonicalizes every generated state and is idempotent",
  (commands) => {
    const state = replay(commands);
    const alreadyReset =
      state.stepIndex === 0 &&
      state.status === "playing" &&
      state.modelCheck.selectedOptionId === null &&
      !state.modelCheck.explanationRevealed;

    const restarted = transition(compiledTwoPointersLesson, state, {
      type: "restart",
    });

    expect({
      deeplyFrozen:
        Object.isFrozen(restarted) && Object.isFrozen(restarted.modelCheck),
      referenceIsCorrect: alreadyReset
        ? restarted === state
        : restarted !== state,
      state: restarted,
    }).toEqual({
      deeplyFrozen: true,
      referenceIsCorrect: true,
      state: {
        lessonId: compiledTwoPointersLesson.id,
        stepIndex: 0,
        status: "playing",
        modelCheck: {
          selectedOptionId: null,
          explanationRevealed: false,
        },
      },
    });
  },
);
