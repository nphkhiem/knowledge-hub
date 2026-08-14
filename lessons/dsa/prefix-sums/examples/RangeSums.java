import java.util.ArrayList;
import java.util.List;

/**
 * Range totals, computed directly and through prefix sums.
 *
 * <p>The prefix list carries a leading zero, so entry i holds the total of the
 * first i values and a range needs no special case when it starts at 0.
 */
public final class RangeSums {
  private RangeSums() {}

  /** One pass. Entry i holds the total of the first i values. */
  public static List<Integer> buildPrefix(List<Integer> values) {
    List<Integer> prefix = new ArrayList<>();
    prefix.add(0);
    for (int value : values) {
      prefix.add(prefix.get(prefix.size() - 1) + value);
    }
    return prefix;
  }

  /** Add the range every time it is asked for. */
  public static int rangeTotalByScan(List<Integer> values, int start, int end) {
    int total = 0;
    for (int index = start; index <= end; index++) {
      total += values.get(index);
    }
    return total;
  }

  /** Two reads and a subtraction, whatever the range covers. */
  public static int rangeTotalByPrefix(List<Integer> prefix, int start, int end) {
    return prefix.get(end + 1) - prefix.get(start);
  }
}
