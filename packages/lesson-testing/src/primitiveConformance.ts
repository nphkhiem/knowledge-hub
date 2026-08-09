import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { expect, test } from "vitest";

/**
 * The behavior every maintainer-owned primitive must provide, expressed as
 * plain callbacks so this kit stays independent of the renderer package.
 * Each callback renders through a context the caller has already chosen:
 * a trusted scene, the same scene at a narrow logical width, or a scene whose
 * author-controlled text is hostile.
 */
export interface PrimitiveContract {
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
  readonly logicalWidth: number;
  readonly logicalHeight: number;
}

const horizontalAttributePattern = /\b(?:x|x1|x2|cx)="(-?[\d.]+)"/g;
const verticalAttributePattern = /\b(?:y|y1|y2|cy)="(-?[\d.]+)"/g;
const pointsAttributePattern = /\bpoints="([^"]+)"/g;

function attributeCoordinates(markup: string, pattern: RegExp): number[] {
  return [...markup.matchAll(pattern)].map((match) => Number(match[1]));
}

function pointCoordinates(
  markup: string,
): Readonly<{ horizontal: readonly number[]; vertical: readonly number[] }> {
  const horizontal: number[] = [];
  const vertical: number[] = [];
  for (const match of markup.matchAll(pointsAttributePattern)) {
    for (const pair of (match[1] ?? "").trim().split(/\s+/)) {
      const [x, y] = pair.split(",").map(Number);
      if (x !== undefined && Number.isFinite(x)) horizontal.push(x);
      if (y !== undefined && Number.isFinite(y)) vertical.push(y);
    }
  }
  return { horizontal, vertical };
}

function outOfBounds(values: readonly number[], limit: number): number[] {
  return values.filter((value) => value < 0 || value > limit);
}

/**
 * Runs the shared primitive contract as its own set of tests. Call it once per
 * primitive from that primitive's test file.
 */
export function runPrimitiveConformance(
  contract: PrimitiveContract,
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
      group: markup.startsWith("<g "),
      hook: markup.includes(`data-object-id="${fixture.object.id}"`),
    }).toEqual({ group: true, hook: true });
  });

  test("renders a static step without interactive hooks", () => {
    const markup = contract.renderStatic(fixture.object);

    expect({
      group: markup.startsWith("<g "),
      hook: markup.includes("data-object-id"),
    }).toEqual({ group: true, hook: false });
  });

  test("produces a plain-text semantic description", () => {
    const description = contract.describe(fixture.object);

    expect({
      empty: description.trim().length === 0,
      markup: /[<>]/.test(description),
    }).toEqual({ empty: false, markup: false });
  });

  test("stays inside the logical viewBox at a narrow width", () => {
    const markup = contract.renderNarrow(fixture.object);
    const points = pointCoordinates(markup);

    expect({
      horizontal: outOfBounds(
        [
          ...attributeCoordinates(markup, horizontalAttributePattern),
          ...points.horizontal,
        ],
        fixture.logicalWidth,
      ),
      vertical: outOfBounds(
        [
          ...attributeCoordinates(markup, verticalAttributePattern),
          ...points.vertical,
        ],
        fixture.logicalHeight,
      ),
    }).toEqual({ horizontal: [], vertical: [] });
  });

  test("never emits raw author-controlled text", () => {
    expect({
      interactive: contract
        .renderUntrusted(fixture.object)
        .includes(fixture.untrustedText),
    }).toEqual({ interactive: false });
  });
}
