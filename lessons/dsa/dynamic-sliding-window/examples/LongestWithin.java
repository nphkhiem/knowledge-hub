import java.util.List;

/**
 * The longest stretch whose total stays within a budget, in one pass.
 *
 * <p>Both search methods answer the same question. One tries every start
 * position and extends from it; the other moves two edges that never go
 * backward. Each reports how many values it looked at, because the difference
 * between them is the point.
 *
 * <p>{@code byWindow} assumes non-negative values. {@code byExhaustive} assumes
 * nothing and is far too slow to use, which is what makes it a reference.
 */
public final class LongestWithin {
  private LongestWithin() {}

  /** The longest width found, and how many values were examined. */
  public record Search(int width, int reads) {}

  /** Try each start position and extend from it. Re-reads what it already saw. */
  public static Search byEveryStart(List<Integer> values, int budget) {
    int best = 0;
    int reads = 0;

    for (int start = 0; start < values.size(); start++) {
      int total = 0;
      for (int end = start; end < values.size(); end++) {
        total += values.get(end);
        reads++;
        if (total > budget) {
          break;
        }
        best = Math.max(best, end - start + 1);
      }
    }

    return new Search(best, reads);
  }

  /** Move two edges, neither ever backward. One pass over the values. */
  public static Search byWindow(List<Integer> values, int budget) {
    int best = 0;
    int total = 0;
    int start = 0;
    int reads = 0;

    for (int end = 0; end < values.size(); end++) {
      total += values.get(end);
      reads++;

      // The front edge comes up only while the budget is broken, and stops as
      // soon as it holds. Both halves need the condition to be one-way.
      while (total > budget && start <= end) {
        total -= values.get(start);
        reads++;
        start++;
      }

      best = Math.max(best, end - start + 1);
    }

    return new Search(best, reads);
  }

  /**
   * Every stretch, with no early exit. Correct on any values, and far too slow
   * to use. It exists so the tests have something to be right against.
   */
  public static int byExhaustive(List<Integer> values, int budget) {
    int best = 0;

    for (int start = 0; start < values.size(); start++) {
      int total = 0;
      for (int end = start; end < values.size(); end++) {
        total += values.get(end);
        if (total <= budget) {
          best = Math.max(best, end - start + 1);
        }
      }
    }

    return best;
  }
}
