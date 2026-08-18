import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.OptionalInt;

public final class TwoSpeedsTest {
  private static int failures = 0;
  private static final List<Integer> READINGS = List.of(4, 8, 15, 16, 23, 42, 9);

  private static void check(String name, boolean passed) {
    if (!passed) {
      System.out.println("FAIL " + name);
      failures++;
    }
  }

  private static List<Integer> range(int length) {
    List<Integer> values = new ArrayList<>(length);
    for (int at = 0; at < length; at++) {
      values.add(at);
    }
    return values;
  }

  /** A straight chain of length nodes, ending rather than looping. */
  private static List<Integer> chain(int length) {
    List<Integer> nexts = new ArrayList<>(length);
    for (int at = 0; at < length; at++) {
      nexts.add(at == length - 1 ? TwoSpeeds.END : at + 1);
    }
    return nexts;
  }

  /** A chain whose last node points back to entrance. */
  private static List<Integer> looped(int length, int entrance) {
    List<Integer> nexts = new ArrayList<>(length);
    for (int at = 0; at < length; at++) {
      nexts.add(at == length - 1 ? entrance : at + 1);
    }
    return nexts;
  }

  public static void main(String[] args) {
    check("the lesson readings",
        TwoSpeeds.middleByTwoSpeeds(READINGS).equals(OptionalInt.of(3))
            && READINGS.get(3) == 16);

    for (int length = 1; length < 60; length++) {
      List<Integer> values = range(length);
      check("both ways agree at " + length,
          TwoSpeeds.middleByTwoSpeeds(values).equals(TwoSpeeds.middleByCounting(values)));
      // The fast position takes two steps per round and stops at the end, so
      // the rounds cannot exceed half the length. Nothing walks twice.
      check("one pass at " + length, TwoSpeeds.stepsTaken(values) <= (length + 1) / 2);
    }

    // A convention rather than a discovery, pinned so a caller can rely on it.
    check("an even length returns the later middle",
        TwoSpeeds.middleByTwoSpeeds(List.of(0, 1, 2, 3)).equals(OptionalInt.of(2)));

    check("an empty sequence has no middle",
        TwoSpeeds.middleByTwoSpeeds(Collections.emptyList()).isEmpty());
    check("a single value is its own middle",
        TwoSpeeds.middleByTwoSpeeds(List.of(9)).equals(OptionalInt.of(0)));

    for (int length = 1; length < 30; length++) {
      check("a straight chain has no cycle", !TwoSpeeds.hasCycle(chain(length), 0));
    }

    // The meeting point is generally not the entrance. This checks the second
    // phase against chains whose entrance is known by construction.
    for (int length = 2; length < 30; length++) {
      for (int entrance = 0; entrance < length - 1; entrance++) {
        List<Integer> nexts = looped(length, entrance);
        check("a looping chain has one", TwoSpeeds.hasCycle(nexts, 0));
        check("the entrance is found",
            TwoSpeeds.cycleEntrance(nexts, 0).equals(OptionalInt.of(entrance)));
      }
    }

    check("no entrance without a cycle",
        TwoSpeeds.cycleEntrance(chain(10), 0).isEmpty());
    check("a node pointing at itself is a cycle",
        TwoSpeeds.hasCycle(List.of(0), 0)
            && TwoSpeeds.cycleEntrance(List.of(0), 0).equals(OptionalInt.of(0)));

    if (failures > 0) {
      System.exit(1);
    }
    System.out.println("All checks passed.");
  }
}
