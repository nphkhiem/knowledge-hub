import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import {
  asSafeMarkup,
  escapeText,
  formatCoordinate,
  renderGroup,
} from "../escapeMarkup.js";
import { ARRAY_TOP, cellCenter } from "../scene.js";
import type {
  PrimitiveContract,
  PrimitiveRenderContext,
  SafeMarkup,
} from "../types.js";

const LABEL_BASELINE = 48;
const VALUE_BASELINE = ARRAY_TOP + 60;
const INDEX_BASELINE = ARRAY_TOP + 84;
const CELL_RADIUS = 6;

function accepts(object: CompiledSceneObject): boolean {
  return object.kind === "array";
}

function describe(object: CompiledSceneObject): string {
  if (object.kind !== "array") return "";
  return `${object.label}: ${object.values.join(", ")}`;
}

function renderCell(
  value: number,
  index: number,
  emphasized: boolean,
  context: PrimitiveRenderContext,
): string {
  const { geometry } = context;
  const x = geometry.left + index * geometry.cellWidth;
  const center = cellCenter(geometry, index);
  const fill = emphasized
    ? "--color-visual-compare-fill"
    : "--color-visual-object-fill";
  const stroke = emphasized
    ? "--color-visual-compare-stroke"
    : "--color-visual-object-stroke";
  const strokeWidth = emphasized
    ? "--visual-active-stroke-width"
    : "--visual-object-stroke-width";

  return [
    `<rect data-cell-index="${index}" x="${formatCoordinate(x)}" y="${geometry.top}"`,
    ` width="${formatCoordinate(geometry.cellWidth)}" height="${geometry.height}" rx="${CELL_RADIUS}"`,
    ` fill="var(${fill})" stroke="var(${stroke})" stroke-width="var(${strokeWidth})"/>`,
    `<text x="${formatCoordinate(center)}" y="${VALUE_BASELINE}" text-anchor="middle"`,
    ` font-size="28" font-weight="${emphasized ? 600 : 400}"`,
    ` fill="var(--color-visual-object-text)">${value}</text>`,
    `<text x="${formatCoordinate(center)}" y="${INDEX_BASELINE}" text-anchor="middle"`,
    ` font-size="14" fill="var(--color-visual-object-text)">${index}</text>`,
  ].join("");
}

function render(
  object: CompiledSceneObject,
  context: PrimitiveRenderContext,
): SafeMarkup {
  if (object.kind !== "array" || !object.visible) return asSafeMarkup("");

  const highlighted = new Set(context.snapshot.highlights[object.id] ?? []);
  const label = [
    `<text x="${formatCoordinate(context.geometry.left)}" y="${LABEL_BASELINE}"`,
    ` font-size="18" fill="var(--color-visual-object-text)">`,
    `${escapeText(object.label)}</text>`,
  ].join("");

  return renderGroup(object, context, "lesson-array", describe(object), [
    label,
    ...object.values.map((value, index) =>
      renderCell(value, index, highlighted.has(index), context),
    ),
  ]);
}

export const arrayPrimitive: PrimitiveContract = {
  accepts,
  describe,
  kind: "array",
  render,
};
