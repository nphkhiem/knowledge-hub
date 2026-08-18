/**
 * Two positions moving at different speeds through a sequence.
 *
 * The midpoint functions run on an array because an array is what a lesson
 * figure can show. The cycle functions run on a chain of successor indices,
 * which is a linked structure written as an array: `nexts[i]` is where `i`
 * points, and END is the end. That is where the technique earns its place.
 */

export const END = -1;

/** Measure, then walk to the middle. Two passes over the values. */
export function middleByCounting(
  values: readonly number[],
): number | undefined {
  if (values.length === 0) return undefined;
  return Math.floor(values.length / 2);
}

/**
 * Advance one position per round and another two. One pass, no counting.
 *
 * With an even number of values there are two candidate middles. This returns
 * the later of them, which is a convention rather than a discovery, and the
 * tests pin it.
 */
export function middleByTwoSpeeds(
  values: readonly number[],
): number | undefined {
  if (values.length === 0) return undefined;

  let slow = 0;
  let fast = 0;
  // The linked-list form is "while fast and fast.next", which here means the
  // fast position can still take a first step.
  while (fast + 1 < values.length) {
    slow += 1;
    fast += 2;
  }

  return slow;
}

/** How many rounds the two-speed walk takes, for the one-pass claim. */
export function stepsTaken(values: readonly number[]): number {
  let rounds = 0;
  let fast = 0;
  while (fast + 1 < values.length) {
    fast += 2;
    rounds += 1;
  }
  return rounds;
}

/**
 * Whether following successors from `start` ever revisits a node.
 *
 * Two references of memory, whatever the chain's length. A visited set answers
 * the same question and costs memory proportional to the chain.
 */
export function hasCycle(nexts: readonly number[], start = 0): boolean {
  if (nexts.length === 0) return false;

  let slow = start;
  let fast = start;
  for (;;) {
    if (fast === END || (nexts[fast] ?? END) === END) return false;
    slow = nexts[slow] ?? END;
    fast = nexts[nexts[fast] ?? END] ?? END;
    if (slow === fast) return true;
  }
}

/**
 * Where the loop begins, or undefined when there is no loop.
 *
 * The meeting point is not the entrance. Finding it takes a second phase:
 * reset one position to the start and advance both one step at a time.
 */
export function cycleEntrance(
  nexts: readonly number[],
  start = 0,
): number | undefined {
  if (!hasCycle(nexts, start)) return undefined;

  let slow = start;
  let fast = start;
  do {
    slow = nexts[slow] ?? END;
    fast = nexts[nexts[fast] ?? END] ?? END;
  } while (slow !== fast);

  let entrance = start;
  while (entrance !== slow) {
    entrance = nexts[entrance] ?? END;
    slow = nexts[slow] ?? END;
  }

  return entrance;
}
