import java.util.ArrayList;
import java.util.List;
import java.util.OptionalInt;

/**
 * Totals of every fixed-width window, rebuilt and repaired.
 *
 * <p>Both methods answer the same question and return the same totals. They
 * differ only in how much arithmetic they do to get there, which is the point
 * of the lesson, so each also reports the additions and subtractions it
 * performed.
 */
public final class WindowTotals {
  private WindowTotals() {}

  /** The total of each window, and the arithmetic it cost to produce them. */
  public record WindowScan(List<Integer> totals, int operations) {}

  /**
   * Windows of {@code width} that fit in {@code length} values, never fewer
   * than zero.
   *
   * <p>A width larger than the sequence yields no windows at all rather than
   * one short window, because a partial window answers a different question.
   */
  public static int windowCount(int length, int width) {
    if (width <= 0) {
      return 0;
    }
    return Math.max(0, length - width + 1);
  }

  /** Add every window from scratch. Costs one addition per value per window. */
  public static WindowScan byRescan(List<Integer> values, int width) {
    List<Integer> totals = new ArrayList<>();
    int operations = 0;

    for (int start = 0; start < windowCount(values.size(), width); start++) {
      int total = 0;
      for (int index = start; index < start + width; index++) {
        total += values.get(index);
        operations++;
      }
      totals.add(total);
    }

    return new WindowScan(totals, operations);
  }

  /** Build the first window, then repair it. Each move costs exactly two. */
  public static WindowScan bySliding(List<Integer> values, int width) {
    int count = windowCount(values.size(), width);
    if (count == 0) {
      return new WindowScan(List.of(), 0);
    }

    int total = 0;
    int operations = 0;
    for (int index = 0; index < width; index++) {
      total += values.get(index);
      operations++;
    }

    List<Integer> totals = new ArrayList<>();
    totals.add(total);
    for (int start = 1; start < count; start++) {
      total -= values.get(start - 1);
      total += values.get(start + width - 1);
      operations += 2;
      totals.add(total);
    }

    return new WindowScan(totals, operations);
  }

  /** The largest window total, or empty when no window fits. */
  public static OptionalInt bestWindowTotal(List<Integer> values, int width) {
    return bySliding(values, width).totals().stream().mapToInt(Integer::intValue).max();
  }
}
