import java.util.HashSet;
import java.util.Set;

/**
 * Count the steps two duplicate checks spend on the same input.
 *
 * <p>The point of the lesson is that the step count, not the wall clock, is
 * what grows with the input, so both methods return the comparisons they made.
 */
public final class MeasureScans {
  private MeasureScans() {}

  /** Compare every item with every later item. Cost grows with n squared. */
  public static int stepsForPairwiseScan(int[] values) {
    int steps = 0;
    for (int left = 0; left < values.length; left++) {
      for (int right = left + 1; right < values.length; right++) {
        steps++;
        if (values[left] == values[right]) {
          return steps;
        }
      }
    }
    return steps;
  }

  /** Read each item once against a set of what was already seen. */
  public static int stepsForSingleScan(int[] values) {
    int steps = 0;
    Set<Integer> seen = new HashSet<>();
    for (int value : values) {
      steps++;
      if (!seen.add(value)) {
        return steps;
      }
    }
    return steps;
  }
}
