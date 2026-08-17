import java.util.ArrayList;
import java.util.List;

/**
 * First-in, first-out order, against the last-in order of a pile.
 *
 * <p>Both methods read the same events and differ only in which end they serve.
 * That single difference is the whole lesson, so they are deliberately
 * identical except for one line each.
 *
 * <p>An event is either an arrival, written "+name", or a service, written "-".
 *
 * <p>The line is a plain list, so serving the front shifts everything down and
 * costs the length rather than a constant. That is the wrong implementation for
 * real use and the clearest one for showing an order. See the deep dive.
 */
public final class FirstInOrder {
  private FirstInOrder() {}

  /** Serve the end that has waited longest. This is a queue. */
  public static List<String> serveFirstIn(List<String> events) {
    List<String> waiting = new ArrayList<>();
    List<String> served = new ArrayList<>();

    for (String event : events) {
      if (event.startsWith("+")) {
        waiting.add(event.substring(1));
      } else if (!waiting.isEmpty()) {
        served.add(waiting.remove(0));
      }
    }

    return served;
  }

  /** Serve the most recent arrival. This is a stack, shown for contrast. */
  public static List<String> serveLastIn(List<String> events) {
    List<String> waiting = new ArrayList<>();
    List<String> served = new ArrayList<>();

    for (String event : events) {
      if (event.startsWith("+")) {
        waiting.add(event.substring(1));
      } else if (!waiting.isEmpty()) {
        served.add(waiting.remove(waiting.size() - 1));
      }
    }

    return served;
  }

  /** The names that arrived, in the order they did. */
  public static List<String> arrivalsIn(List<String> events) {
    List<String> arrivals = new ArrayList<>();
    for (String event : events) {
      if (event.startsWith("+")) {
        arrivals.add(event.substring(1));
      }
    }
    return arrivals;
  }

  /** One early arrival, then arrivals and services alternating forever. */
  public static List<String> steadyStream(String first, int rounds) {
    List<String> events = new ArrayList<>();
    events.add("+" + first);
    for (int round = 0; round < rounds; round++) {
      events.add("+later-" + round);
      events.add("-");
    }
    return events;
  }
}
