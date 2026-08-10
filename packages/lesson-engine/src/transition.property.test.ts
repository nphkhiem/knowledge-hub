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
const runtimeCommandArbitrary: fc.Arbitrary<unknown> = fc.oneof(
  engineCommandArbitrary,
  fc.record({
    type: fc
      .string({ minLength: 1, maxLength: 30 })
      .filter(
        (type) =>
          ![
            "play",
            "pause",
            "restart",
            "next",
            "previous",
            "seek",
            "answer",
          ].includes(type),
      ),
  }),
  fc.constantFrom(null, undefined),
  fc.integer(),
);
const longMixedCommandSequenceArbitrary = fc
  .array(engineCommandArbitrary, {
    minLength: 150,
    maxLength: 200,
    size: "max",
  })
  .filter(
    (commands) => new Set(commands.map((command) => command.type)).size === 7,
  );

function probeEngineCommand(value: unknown): EngineCommand {
  return value as EngineCommand;
}

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

function isCoherentFrozenState(state: EngineState): boolean {
  const lastStepIndex = compiledTwoPointersLesson.snapshots.length - 1;
  const terminal =
    compiledTwoPointersLesson.snapshots[state.stepIndex]?.terminal === true;
  return (
    Object.isFrozen(state) &&
    Object.isFrozen(state.modelCheck) &&
    state.lessonId === compiledTwoPointersLesson.id &&
    state.stepIndex >= 0 &&
    state.stepIndex <= lastStepIndex &&
    (terminal ? state.status === "completed" : state.status !== "completed")
  );
}

function findIncoherentState(
  commands: readonly EngineCommand[],
): EngineState | null {
  return (
    replayStates(commands).find((state) => !isCoherentFrozenState(state)) ??
    null
  );
}

interface MutatedInput {
  readonly command: EngineCommand;
  readonly expected: EngineState;
  readonly mutated: EngineState;
}

function findMutatedInput(
  commands: readonly EngineCommand[],
): MutatedInput | null {
  let state = createInitialEngineState(compiledTwoPointersLesson);

  for (const command of commands) {
    const input = structuredClone(state);
    const expected = structuredClone(input);
    state = transition(compiledTwoPointersLesson, input, command);
    if (JSON.stringify(input) !== JSON.stringify(expected)) {
      return { command, expected, mutated: input };
    }
  }
  return null;
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
    expect({ incoherentState: findIncoherentState(commands) }).toEqual({
      incoherentState: null,
    });
  },
);

test.prop([commandSequenceArbitrary], { seed: 40_304_004 })(
  "does not mutate any input state across arbitrary command sequences",
  (commands) => {
    expect({ mutatedInput: findMutatedInput(commands) }).toEqual({
      mutatedInput: null,
    });
  },
);

test.prop([longMixedCommandSequenceArbitrary], {
  seed: 40_304_014,
  numRuns: 40,
})(
  "preserves all invariants across 150 to 200 mixed runtime commands",
  (commands) => {
    const firstReplay = replay(commands);
    const secondReplay = replay(commands);

    expect({
      deterministic:
        JSON.stringify(firstReplay) === JSON.stringify(secondReplay),
      incoherentState: findIncoherentState(commands),
      includesEveryCommand: new Set(commands.map((command) => command.type))
        .size,
      lengthInRange: commands.length >= 150 && commands.length <= 200,
      mutatedInput: findMutatedInput(commands),
    }).toEqual({
      deterministic: true,
      incoherentState: null,
      includesEveryCommand: 7,
      lengthInRange: true,
      mutatedInput: null,
    });
  },
);

test.prop([runtimeCommandArbitrary], { seed: 40_304_015 })(
  "answers every runtime command probe with a coherent frozen state",
  (runtimeCommand) => {
    const result = transition(
      compiledTwoPointersLesson,
      createInitialEngineState(compiledTwoPointersLesson),
      probeEngineCommand(runtimeCommand),
    );

    expect({
      incoherentResult: isCoherentFrozenState(result) ? null : result,
    }).toEqual({ incoherentResult: null });
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

test.prop([fc.option(knownOptionIdArbitrary, { nil: null }), fc.boolean()], {
  seed: 40_304_017,
})(
  "next at the terminal snapshot returns every valid state unchanged",
  (selectedOptionId, revealExplanation) => {
    const state: EngineState = Object.freeze({
      lessonId: compiledTwoPointersLesson.id,
      stepIndex: compiledTwoPointersLesson.snapshots.length - 1,
      status: "completed",
      modelCheck: Object.freeze({
        selectedOptionId,
        explanationRevealed: selectedOptionId !== null && revealExplanation,
      }),
    });

    expect(transition(compiledTwoPointersLesson, state, { type: "next" })).toBe(
      state,
    );
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
    const restarted = transition(compiledTwoPointersLesson, replay(commands), {
      type: "restart",
    });
    const restartedAgain = transition(compiledTwoPointersLesson, restarted, {
      type: "restart",
    });

    expect({
      deeplyFrozen:
        Object.isFrozen(restarted) && Object.isFrozen(restarted.modelCheck),
      idempotentByReference: restartedAgain === restarted,
      state: restarted,
    }).toEqual({
      deeplyFrozen: true,
      idempotentByReference: true,
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
