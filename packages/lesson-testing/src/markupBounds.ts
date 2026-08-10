const horizontalAttributePattern = /\b(?:x|x1|x2|cx)="(-?[\d.]+)"/g;
const verticalAttributePattern = /\b(?:y|y1|y2|cy)="(-?[\d.]+)"/g;
const pointsAttributePattern = /\bpoints="([^"]+)"/g;
const textElementPattern = /<text\b([^>]*)>([^<]*)<\/text>/g;

/**
 * Deliberately wider than any renderer's own glyph estimate, so a figure that
 * passes this check has real slack rather than sitting exactly on the edge.
 */
const CHARACTER_WIDTH_RATIO = 0.6;

function attributeOf(attributes: string, name: string): string | undefined {
  return new RegExp(`\\b${name}="([^"]*)"`).exec(attributes)?.[1];
}

function textExtent(
  attributes: string,
  content: string,
): Readonly<{ from: number; to: number }> | undefined {
  const x = Number(attributeOf(attributes, "x"));
  const fontSize = Number(attributeOf(attributes, "font-size"));
  if (!Number.isFinite(x) || !Number.isFinite(fontSize)) return undefined;

  const width = content.length * fontSize * CHARACTER_WIDTH_RATIO;
  switch (attributeOf(attributes, "text-anchor")) {
    case "middle":
      return { from: x - width / 2, to: x + width / 2 };
    case "end":
      return { from: x - width, to: x };
    default:
      return { from: x, to: x + width };
  }
}

/**
 * Every coordinate, polygon point, and estimated text extent in `markup` that
 * falls outside the logical viewBox, described well enough to fix.
 */
export function findOutOfBoundsCoordinates(
  markup: string,
  logicalWidth: number,
  logicalHeight: number,
): readonly string[] {
  const offenders: string[] = [];

  const report = (label: string, value: number, limit: number): void => {
    if (value < 0 || value > limit) {
      offenders.push(
        `${label}=${Number(value.toFixed(2))} outside 0..${limit}`,
      );
    }
  };

  for (const match of markup.matchAll(horizontalAttributePattern)) {
    report("x", Number(match[1]), logicalWidth);
  }
  for (const match of markup.matchAll(verticalAttributePattern)) {
    report("y", Number(match[1]), logicalHeight);
  }
  for (const match of markup.matchAll(pointsAttributePattern)) {
    for (const pair of (match[1] ?? "").trim().split(/\s+/)) {
      const [x, y] = pair.split(",").map(Number);
      if (x !== undefined) report("point x", x, logicalWidth);
      if (y !== undefined) report("point y", y, logicalHeight);
    }
  }
  for (const match of markup.matchAll(textElementPattern)) {
    const content = match[2] ?? "";
    const extent = textExtent(match[1] ?? "", content);
    if (extent === undefined) continue;
    const label = `text ${JSON.stringify(content.slice(0, 24))}`;
    report(`${label} start`, extent.from, logicalWidth);
    report(`${label} end`, extent.to, logicalWidth);
  }

  return offenders;
}
