/**
 * Last-in, first-out order, and one thing it is genuinely needed for.
 *
 * `drain` exists to state the defining property: what comes out is what went
 * in, reversed. `isBalanced` exists because that property does real work there,
 * and a counter of opens and closes cannot do the same job.
 */

const PAIRS: Readonly<Record<string, string>> = {
  ")": "(",
  "]": "[",
  "}": "{",
};

const OPENERS = "([{";

/** Push everything, then pop everything. The order reverses. */
export function drain(items: readonly string[]): string[] {
  const pile: string[] = [];
  for (const item of items) {
    pile.push(item);
  }

  const out: string[] = [];
  while (pile.length > 0) {
    const top = pile.pop();
    if (top !== undefined) out.push(top);
  }
  return out;
}

/** Whether every bracket closes the one most recently left open. */
export function isBalanced(text: string): boolean {
  const pile: string[] = [];

  for (const character of text) {
    if (OPENERS.includes(character)) {
      pile.push(character);
      continue;
    }
    const opener = PAIRS[character];
    if (opener === undefined) continue;
    // Two distinct failures: nothing is open, or the wrong thing is.
    if (pile.length === 0 || pile.at(-1) !== opener) return false;
    pile.pop();
  }

  // Anything still open never closed.
  return pile.length === 0;
}

/** How deep the pile ever got, which is the space this really costs. */
export function deepestNesting(text: string): number {
  let depth = 0;
  let deepest = 0;

  for (const character of text) {
    if (OPENERS.includes(character)) {
      depth += 1;
      deepest = Math.max(deepest, depth);
    } else if (PAIRS[character] !== undefined && depth > 0) {
      depth -= 1;
    }
  }

  return deepest;
}
