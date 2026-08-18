import java.util.List;
import java.util.OptionalInt;

/**
 * Two positions moving at different speeds through a sequence.
 *
 * <p>The midpoint methods run on a list because a list is what a lesson figure
 * can show. The cycle methods run on a chain of successor indices, which is a
 * linked structure written as a list: {@code nexts.get(i)} is where {@code i}
 * points, and {@link #END} is the end. That is where this earns its place.
 */
public final class TwoSpeeds {
  private TwoSpeeds() {}

  public static final int END = -1;

  /** Measure, then walk to the middle. Two passes over the values. */
  public static OptionalInt middleByCounting(List<Integer> values) {
    if (values.isEmpty()) {
      return OptionalInt.empty();
    }
    return OptionalInt.of(values.size() / 2);
  }

  /**
   * Advance one position per round and another two. One pass, no counting.
   *
   * <p>With an even number of values there are two candidate middles. This
   * returns the later of them, which is a convention the tests pin.
   */
  public static OptionalInt middleByTwoSpeeds(List<Integer> values) {
    if (values.isEmpty()) {
      return OptionalInt.empty();
    }

    int slow = 0;
    int fast = 0;
    // The linked-list form is "while fast and fast.next", which here means the
    // fast position can still take a first step.
    while (fast + 1 < values.size()) {
      slow++;
      fast += 2;
    }

    return OptionalInt.of(slow);
  }

  /** How many rounds the two-speed walk takes, for the one-pass claim. */
  public static int stepsTaken(List<Integer> values) {
    int rounds = 0;
    int fast = 0;
    while (fast + 1 < values.size()) {
      fast += 2;
      rounds++;
    }
    return rounds;
  }

  /**
   * Whether following successors from {@code start} ever revisits a node. Two
   * references of memory, whatever the chain's length.
   */
  public static boolean hasCycle(List<Integer> nexts, int start) {
    if (nexts.isEmpty()) {
      return false;
    }

    int slow = start;
    int fast = start;
    while (true) {
      if (fast == END || nexts.get(fast) == END) {
        return false;
      }
      slow = nexts.get(slow);
      fast = nexts.get(nexts.get(fast));
      if (slow == fast) {
        return true;
      }
    }
  }

  /**
   * Where the loop begins, or empty when there is no loop. The meeting point is
   * not the entrance, so this runs a second phase to find it.
   */
  public static OptionalInt cycleEntrance(List<Integer> nexts, int start) {
    if (!hasCycle(nexts, start)) {
      return OptionalInt.empty();
    }

    int slow = start;
    int fast = start;
    do {
      slow = nexts.get(slow);
      fast = nexts.get(nexts.get(fast));
    } while (slow != fast);

    int entrance = start;
    while (entrance != slow) {
      entrance = nexts.get(entrance);
      slow = nexts.get(slow);
    }

    return OptionalInt.of(entrance);
  }
}
