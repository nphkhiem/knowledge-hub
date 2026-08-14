import type { CompiledSceneObject } from "@knowledge-hub/lesson-compiler";
import { definePrimitive } from "../definePrimitive.js";
import { escapeText, formatCoordinate } from "../escapeMarkup.js";
import { cellCenter, clampTextStart, fitFontSize } from "../geometry.js";
import { renderGroup } from "../renderGroup.js";
import type { ArrayGeometry } from "../types.js";

type ArrayObject = Extract<CompiledSceneObject, { kind: "array" }>;

/** The array's label sits a fixed distance above its own row. */
const LABEL_OFFSET_ABOVE_TOP = 112;
const LABEL_FONT_SIZE = 18;
const VALUE_OFFSET = 60;
const INDEX_OFFSET = 84;
const CELL_RADIUS = 6;

interface CellAppearance {
  readonly fill: string;
  readonly stroke: string;
  readonly strokeWidth: string;
  readonly fontWeight: number;
}

export const emphasizedCell: CellAppearance = {
  fill: "--color-visual-compare-fill",
  fontWeight: 600,
  stroke: "--color-visual-compare-stroke",
  strokeWidth: "--visual-active-stroke-width",
};

export const plainCell: CellAppearance = {
  fill: "--color-visual-object-fill",
  fontWeight: 400,
  stroke: "--color-visual-object-stroke",
  strokeWidth: "--visual-object-stroke-width",
};

function describeArray(object: ArrayObject): string {
  return `${object.label}: ${object.values.join(", ")}`;
}

function renderCell(
  value: number,
  index: number,
  emphasized: boolean,
  geometry: ArrayGeometry,
): string {
  const appearance = emphasized ? emphasizedCell : plainCell;
  const x = geometry.left + index * geometry.cellWidth;
  const center = cellCenter(geometry, index);
  const valueFontSize = fitFontSize(geometry.cellWidth, 28, 10, 0.5);
  const indexFontSize = fitFontSize(geometry.cellWidth, 14, 7, 0.28);

  return [
    `<rect data-cell-index="${index}" x="${formatCoordinate(x)}" y="${geometry.top}"`,
    ` width="${formatCoordinate(geometry.cellWidth)}" height="${geometry.height}" rx="${CELL_RADIUS}"`,
    ` fill="var(${appearance.fill})" stroke="var(${appearance.stroke})"`,
    ` stroke-width="var(${appearance.strokeWidth})"/>`,
    `<text x="${formatCoordinate(center)}" y="${geometry.top + VALUE_OFFSET}" text-anchor="middle"`,
    ` font-size="${formatCoordinate(valueFontSize)}" font-weight="${appearance.fontWeight}"`,
    ` fill="var(--color-visual-object-text)">${value}</text>`,
    `<text x="${formatCoordinate(center)}" y="${geometry.top + INDEX_OFFSET}" text-anchor="middle"`,
    ` font-size="${formatCoordinate(indexFontSize)}"`,
    ` fill="var(--color-visual-object-text)">${index}</text>`,
  ].join("");
}

export const arrayPrimitive = definePrimitive("array", {
  describe: describeArray,

  render: (object, context) => {
    const highlighted = new Set(context.snapshot.highlights[object.id] ?? []);
    // This array's own band, so a second array neither overlaps the first nor
    // borrows its cell width.
    const geometry = context.geometryFor(object.id);
    const labelX = clampTextStart(geometry.left, object.label, LABEL_FONT_SIZE);
    const label = [
      `<text x="${formatCoordinate(labelX)}" y="${geometry.top - LABEL_OFFSET_ABOVE_TOP}"`,
      ` text-anchor="start" font-size="${LABEL_FONT_SIZE}"`,
      ` fill="var(--color-visual-object-text)">${escapeText(object.label)}</text>`,
    ].join("");

    return renderGroup(object, context, "lesson-array", describeArray(object), [
      label,
      ...object.values.map((value, index) =>
        renderCell(value, index, highlighted.has(index), geometry),
      ),
    ]);
  },
});
