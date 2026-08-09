import fc from "fast-check";
import { expect, test } from "vitest";
import { compiledTwoPointersLesson } from "@knowledge-hub/lesson-testing";
import {
  createInitialEngineState,
  transition,
  type EngineCommand,
  type EngineState,
} from "./index.js";

const engineCommandArbitrary: fc.Arbitrary<EngineCommand> = fc.oneof(
  fc.constant({ type: "play" as const }),
  fc.constant({ type: "pause" as const }),
  fc.constant({ type: "restart" as const }),
  fc.constant({ type: "next" as const }),
  fc.constant({ type: "previous" as const }),
  fc.record({
    type: fc.constant("seek" as const),
    stepIndex: fc.integer({ min: -500, max: 500 }),
  }),
  fc.record({
    type: fc.constant("answer" as const),
    optionId: fc.oneof(
      fc.constantFrom(
        ...compiledTwoPointersLesson.modelCheck.options.map(
          (option) => option.id,
        ),
      ),
      fc.string({ minLength: 1, maxLength: 40 }),
    ),
    revealExplanation: fc.boolean(),
  }),
);

test("pause preserves generated input states without mutating them", () => {
  fc.assert(
    fc.property(
      fc.integer({
        min: 0,
        max: compiledTwoPointersLesson.snapshots.length - 1,
      }),
      fc.option(
        fc.constantFrom(
          ...compiledTwoPointersLesson.modelCheck.options.map(
            (option) => option.id,
          ),
        ),
        { nil: null },
      ),
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
    ),
    { seed: 40_304_001 },
  );
});

test("replays generated forward command sequences deterministically", () => {
  fc.assert(
    fc.property(
      fc.integer({
        min: 1,
        max: compiledTwoPointersLesson.snapshots.length - 1,
      }),
      (nextCount) => {
        const commands: readonly EngineCommand[] = [
          { type: "play" },
          ...Array.from({ length: nextCount }, () => ({
            type: "next" as const,
          })),
        ];
        const replay = () =>
          commands.reduce(
            (state, command) =>
              transition(compiledTwoPointersLesson, state, command),
            createInitialEngineState(compiledTwoPointersLesson),
          );

        const first = replay();
        const second = replay();

        expect({
          first,
          replayedExactly: JSON.stringify(first) === JSON.stringify(second),
        }).toEqual({
          first: {
            lessonId: compiledTwoPointersLesson.id,
            stepIndex: nextCount,
            status:
              nextCount === compiledTwoPointersLesson.snapshots.length - 1
                ? "completed"
                : "playing",
            modelCheck: {
              selectedOptionId: null,
              explanationRevealed: false,
            },
          },
          replayedExactly: true,
        });
      },
    ),
    { seed: 40_304_002 },
  );
});

test("previous at the first snapshot returns every valid state unchanged", () => {
  fc.assert(
    fc.property(
      fc.constantFrom("idle" as const, "playing" as const, "paused" as const),
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
    ),
    { seed: 40_304_003 },
  );
});

test("seek clamps generated indices without leaving the lesson range or identity", () => {
  fc.assert(
    fc.property(fc.integer({ min: -500, max: 500 }), (requestedStep) => {
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
    }),
    { seed: 40_304_004 },
  );
});

test("seek rejects non-integer indices with the unchanged state reference", () => {
  fc.assert(
    fc.property(
      fc.constantFrom(Number.NaN, Number.POSITIVE_INFINITY, -Infinity, 1.5),
      (stepIndex) => {
        const initial = createInitialEngineState(compiledTwoPointersLesson);

        expect(
          transition(compiledTwoPointersLesson, initial, {
            type: "seek",
            stepIndex,
          }),
        ).toBe(initial);
      },
    ),
    { seed: 40_304_005 },
  );
});

test("answer rejects generated unknown option identifiers unchanged", () => {
  const knownOptionIds = new Set(
    compiledTwoPointersLesson.modelCheck.options.map((option) => option.id),
  );

  fc.assert(
    fc.property(
      fc
        .string({ minLength: 1, maxLength: 40 })
        .filter((optionId) => !knownOptionIds.has(optionId)),
      fc.boolean(),
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
    ),
    { seed: 40_304_006 },
  );
});

test("generated command sequences stay frozen within lesson bounds", () => {
  fc.assert(
    fc.property(
      fc.array(engineCommandArbitrary, { maxLength: 200 }),
      (commands) => {
        const finalState = commands.reduce(
          (state, command) =>
            transition(compiledTwoPointersLesson, state, command),
          createInitialEngineState(compiledTwoPointersLesson),
        );

        expect({
          deeplyFrozen:
            Object.isFrozen(finalState) &&
            Object.isFrozen(finalState.modelCheck),
          lessonId: finalState.lessonId,
          stepInRange:
            finalState.stepIndex >= 0 &&
            finalState.stepIndex < compiledTwoPointersLesson.snapshots.length,
          completedOnlyAtTerminal:
            finalState.status !== "completed" ||
            compiledTwoPointersLesson.snapshots[finalState.stepIndex]
              ?.terminal === true,
        }).toEqual({
          deeplyFrozen: true,
          lessonId: compiledTwoPointersLesson.id,
          stepInRange: true,
          completedOnlyAtTerminal: true,
        });
      },
    ),
    { seed: 40_304_007 },
  );
});
