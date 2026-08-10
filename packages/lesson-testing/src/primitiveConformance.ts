import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { expect, test } from "vitest";
import { findOutOfBoundsCoordinates } from "./markupBounds.js";

/**
 * The behavior every maintainer-owned primitive must provide, expressed as
 * plain callbacks so this kit stays independent of the renderer package.
 * Each callback renders through a context the caller has already chosen:
 * a trusted scene, the same scene at a narrow logical width, or a scene whose
 * author-controlled text is hostile.
 */
export interface PrimitiveConformanceContract {
  readonly kind: CompiledSceneObject["kind"];
  readonly accepts: (object: CompiledSceneObject) => boolean;
  readonly renderInteractive: (object: CompiledSceneObject) => string;
  readonly renderStatic: (object: CompiledSceneObject) => string;
  readonly renderNarrow: (object: CompiledSceneObject) => string;
  readonly renderUntrusted: (object: CompiledSceneObject) => string;
  readonly describe: (object: CompiledSceneObject) => string;
}

export interface PrimitiveFixture {
  readonly object: CompiledSceneObject;
  readonly foreignObject: CompiledSceneObject;
  readonly untrustedText: string;
  readonly escapedText: string;
  /**
   * Whether this primitive draws any author-controlled string of its own. When
   * it does, the escaped form must appear; either way the raw form must not.
   */
  readonly emitsAuthorText: boolean;
  readonly logicalWidth: number;
  readonly logicalHeight: number;
}

/**
 * Runs the shared primitive contract as its own set of tests. Call it once per
 * primitive from that primitive's test file.
 */
export function runPrimitiveConformance(
  contract: PrimitiveConformanceContract,
  fixture: PrimitiveFixture,
): void {
  test("accepts only its own normalized scene objects", () => {
    expect({
      foreign: contract.accepts(fixture.foreignObject),
      own: contract.accepts(fixture.object),
    }).toEqual({ foreign: false, own: true });
  });

  test("renders an interactive group with a stable object hook", () => {
    const markup = contract.renderInteractive(fixture.object);

    expect({
      markup,
      opensAGroup: markup.startsWith("<g "),
      objectHook: markup.includes(`data-object-id="${fixture.object.id}"`),
    }).toEqual({
      markup,
      opensAGroup: true,
      objectHook: true,
    });
  });

  test("renders a static step without interactive hooks", () => {
    const markup = contract.renderStatic(fixture.object);

    expect({
      markup,
      objectHook: markup.includes("data-object-id"),
      opensAGroup: markup.startsWith("<g "),
    }).toEqual({
      markup,
      objectHook: false,
      opensAGroup: true,
    });
  });

  test("produces a plain-text semantic description", () => {
    const description = contract.describe(fixture.object);

    expect({
      description,
      empty: description.trim().length === 0,
      leaksMarkup: /[<>]/.test(description),
    }).toEqual({ description, empty: false, leaksMarkup: false });
  });

  test("stays inside the logical viewBox at a narrow width", () => {
    expect(
      findOutOfBoundsCoordinates(
        contract.renderNarrow(fixture.object),
        fixture.logicalWidth,
        fixture.logicalHeight,
      ),
    ).toEqual([]);
  });

  test("escapes author-controlled text instead of emitting it raw", () => {
    const markup = contract.renderUntrusted(fixture.object);

    expect({
      escaped: markup.includes(fixture.escapedText),
      markup,
      raw: markup.includes(fixture.untrustedText),
    }).toEqual({
      escaped: fixture.emitsAuthorText,
      markup,
      raw: false,
    });
  });
}
