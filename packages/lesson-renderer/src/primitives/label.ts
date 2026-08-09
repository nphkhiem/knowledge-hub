import { definePrimitive } from "../definePrimitive.js";
import { escapeText, formatCoordinate } from "../escapeMarkup.js";
import { LOGICAL_WIDTH, clampTextEnd } from "../geometry.js";
import { renderGroup } from "../renderGroup.js";
import { ordinalAmongKind } from "../scene.js";

const RIGHT_MARGIN = 60;
const FIRST_BASELINE = 48;
const LINE_HEIGHT = 30;
const FONT_SIZE = 18;

export const labelPrimitive = definePrimitive("label", {
  describe: (object) => object.text,

  render: (object, context) => {
    const baseline =
      FIRST_BASELINE + ordinalAmongKind(context.snapshot, object) * LINE_HEIGHT;
    const x = clampTextEnd(
      LOGICAL_WIDTH - RIGHT_MARGIN,
      object.text,
      FONT_SIZE,
    );

    return renderGroup(object, context, "lesson-label", object.text, [
      [
        `<text x="${formatCoordinate(x)}" y="${baseline}" text-anchor="end"`,
        ` font-size="${FONT_SIZE}" fill="var(--color-visual-object-text)">`,
        `${escapeText(object.text)}</text>`,
      ].join(""),
    ]);
  },
});
