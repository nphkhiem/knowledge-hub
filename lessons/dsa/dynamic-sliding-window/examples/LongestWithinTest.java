import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class LongestWithinTest {
  private static int failures = 0;
  private static final List<Integer> READINGS = List.of(2, 3, 1, 4, 2);
  private static final int BUDGET = 6;

  private static void check(String name, boolean passed) {
    if (!passed) {
      System.out.println("FAIL " + name);
      failures++;
    }
  }

  private static List<Integer> repeated(int value, int times) {
    List<Integer> values = new ArrayList<>(times);
    for (int at = 0; at < times; at++) {
      values.add(value);
    }
    return values;
  }

  public static void main(String[] args) {
    check("the lesson readings", LongestWithin.byWindow(READINGS, BUDGET).width() == 3);

    List<List<Integer>> sequences =
        List.of(
            Collections.emptyList(),
            List.of(5),
            READINGS,
            List.of(1, 1, 1, 1),
            List.of(0, 0, 4, 0),
            List.of(9, 9));
    for (List<Integer> values : sequences) {
      for (int budget = 0; budget <= 11; budget++) {
        check("window matches the truth",
            LongestWithin.byWindow(values, budget).width()
                == LongestWithin.byExhaustive(values, budget));
        check("both approaches agree",
            LongestWithin.byWindow(values, budget).width()
                == LongestWithin.byEveryStart(values, budget).width());
      }
    }

    // The property the lesson teaches. Each edge crosses the values once, so
    // the total reads cannot exceed two per value however much the window
    // grows and shrinks in between.
    for (List<Integer> values : List.of(READINGS, repeated(1, 50), repeated(3, 8))) {
      check("each value is read at most twice",
          LongestWithin.byWindow(values, 6).reads() <= 2 * values.size());
    }

    List<Integer> forty = repeated(1, 40);
    check("trying every start costs far more",
        LongestWithin.byEveryStart(forty, 6).reads() > 5 * forty.size());

    check("a budget below every value admits nothing",
        LongestWithin.byWindow(List.of(4, 5, 6), 3).width() == 0);
    check("a budget above the total admits everything",
        LongestWithin.byWindow(READINGS, 100).width() == READINGS.size());
    check("an empty sequence has no stretch",
        LongestWithin.byWindow(Collections.emptyList(), 6).width() == 0);
    check("zeros extend a stretch for free",
        LongestWithin.byWindow(List.of(0, 0, 0), 0).width() == 3);

    // Not a warning left in prose. The window returns a smaller answer than the
    // truth, with nothing to indicate anything went wrong.
    List<Integer> negative = List.of(5, -4, 1);
    check("the truth finds three", LongestWithin.byExhaustive(negative, 2) == 3);
    check("the window finds only two",
        LongestWithin.byWindow(negative, 2).width() == 2);

    if (failures > 0) {
      System.exit(1);
    }
    System.out.println("All checks passed.");
  }
}
