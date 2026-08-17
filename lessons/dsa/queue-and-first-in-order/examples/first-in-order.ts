/**
 * First-in, first-out order, against the last-in order of a pile.
 *
 * Both functions read the same events and differ only in which end they serve.
 * That single difference is the whole lesson, so they are deliberately
 * identical except for one line each.
 *
 * An event is either an arrival, written "+name", or a service, written "-".
 *
 * The line is a plain array, so serving the front shifts everything down and
 * costs the length rather than a constant. That is the wrong implementation for
 * real use and the clearest one for showing an order. See the deep dive.
 */

/** Serve the end that has waited longest. This is a queue. */
export function serveFirstIn(events: readonly string[]): string[] {
  const waiting: string[] = [];
  const served: string[] = [];

  for (const event of events) {
    if (event.startsWith("+")) {
      waiting.push(event.slice(1));
    } else {
      const front = waiting.shift();
      if (front !== undefined) served.push(front);
    }
  }

  return served;
}

/** Serve the most recent arrival. This is a stack, shown for contrast. */
export function serveLastIn(events: readonly string[]): string[] {
  const waiting: string[] = [];
  const served: string[] = [];

  for (const event of events) {
    if (event.startsWith("+")) {
      waiting.push(event.slice(1));
    } else {
      const newest = waiting.pop();
      if (newest !== undefined) served.push(newest);
    }
  }

  return served;
}

/** The names that arrived, in the order they did. */
export function arrivalsIn(events: readonly string[]): string[] {
  return events
    .filter((event) => event.startsWith("+"))
    .map((event) => event.slice(1));
}

/** One early arrival, then arrivals and services alternating forever. */
export function steadyStream(first: string, rounds: number): string[] {
  const events = [`+${first}`];
  for (let round = 0; round < rounds; round += 1) {
    events.push(`+later-${round}`, "-");
  }
  return events;
}
