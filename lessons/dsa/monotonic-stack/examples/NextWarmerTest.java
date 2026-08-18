import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.OptionalInt;

public final class NextWarmerTest {
  private static int failures = 0;
  private static final List<Integer> HIGHS = List.of(30, 28, 33, 31, 35);

  private static void check(String name, boolean passed) {
    if (!passed) {
      System.out.println("FAIL " + name);
      failures++;
    }
  }

  private static List<Integer> rising(int length) {
    List<Integer> values = new ArrayList<>();
    for (int at = 0; at < length; at++) {
      values.add(at);
    }
    return values;
  }

  private static List<Integer> falling(int length) {
    List<Integer> values = new ArrayList<>();
    for (int at = 0; at < length; at++) {
      values.add(length - at);
    }
    return values;
  }

  public static void main(String[] args) {
    check("the lesson readings",
        NextWarmer.byOrderedPile(HIGHS).waits()
            .equals(List.of(OptionalInt.of(2), OptionalInt.of(1), OptionalInt.of(2),
                OptionalInt.of(1), OptionalInt.empty())));

    List<List<Integer>> shapes =
        List.of(
            Collections.emptyList(),
            List.of(5),
            HIGHS,
            List.of(1, 2, 3, 4),
            List.of(4, 3, 2, 1),
            List.of(7, 7, 7),
            List.of(2, 1, 2, 1, 2),
            List.of(10, 1, 9, 2, 8, 3));
    for (List<Integer> highs : shapes) {
      check("both approaches agree",
          NextWarmer.byOrderedPile(highs).waits()
              .equals(NextWarmer.byComparingPairs(highs).waits()));
    }

    // The claim the lesson makes. One reading can pop many, so the bound is
    // over the whole pass rather than any single step.
    for (int length : new int[] {1, 5, 20, 60}) {
      for (List<Integer> highs : List.of(rising(length), falling(length))) {
        check("pushed once, popped at most once",
            NextWarmer.byOrderedPile(highs).comparisons() <= 2 * highs.size());
      }
    }

    // The worst case for pairs: no day is ever answered, so every day looks at
    // every later day.
    List<Integer> steep = falling(40);
    check("comparing pairs is quadratic",
        NextWarmer.byComparingPairs(steep).comparisons() > 10 * steep.size());
    check("the pile stays linear",
        NextWarmer.byOrderedPile(steep).comparisons() <= 2 * steep.size());

    check("a falling sequence answers nobody",
        NextWarmer.byOrderedPile(List.of(5, 4, 3)).waits()
            .equals(List.of(OptionalInt.empty(), OptionalInt.empty(), OptionalInt.empty())));

    // Warmer means strictly warmer. Equal temperatures leave both waiting.
    check("equal days do not answer each other",
        NextWarmer.byOrderedPile(List.of(7, 7, 8)).waits()
            .equals(List.of(OptionalInt.of(2), OptionalInt.of(1), OptionalInt.empty())));

    // A result rather than an error, and distinct from a distance of zero.
    for (List<Integer> highs : List.of(HIGHS, List.of(1, 2, 3), List.of(3, 2, 1), List.of(9))) {
      List<OptionalInt> waits = NextWarmer.byOrderedPile(highs).waits();
      check("the last day never has an answer", waits.get(waits.size() - 1).isEmpty());
    }

    check("an empty history",
        NextWarmer.byOrderedPile(Collections.emptyList()).waits().isEmpty());

    if (failures > 0) {
      System.exit(1);
    }
    System.out.println("All checks passed.");
  }
}
