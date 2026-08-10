import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * A plain main-method test harness: no JUnit dependency, exits nonzero and prints every failure
 * (not just the first) so a broken change is diagnosed in one run, matching this repository's
 * Python and TypeScript test style.
 */
public final class FindPairWithSumTest {

  private FindPairWithSumTest() {}

  public static void main(String[] args) {
    List<String> failures = new ArrayList<>();

    checkEquals(
        failures,
        "finds the pair the lesson animates",
        Optional.of(new int[] {2, 4}),
        FindPairWithSum.findPairWithSum(new int[] {1, 2, 4, 7, 11, 15}, 15));

    checkEquals(
        failures,
        "reports no pair for an empty array rather than guessing",
        Optional.empty(),
        FindPairWithSum.findPairWithSum(new int[] {}, 5));
    checkEquals(
        failures,
        "reports no pair when none sums to the target",
        Optional.empty(),
        FindPairWithSum.findPairWithSum(new int[] {1, 2, 4, 7, 11, 15}, 100));
    checkEquals(
        failures,
        "reports no pair for a single-element array",
        Optional.empty(),
        FindPairWithSum.findPairWithSum(new int[] {5}, 5));

    checkEquals(
        failures,
        "handles an adjacent pair",
        Optional.of(new int[] {0, 1}),
        FindPairWithSum.findPairWithSum(new int[] {3, 4}, 7));
    checkEquals(
        failures,
        "handles a pair at both endpoints",
        Optional.of(new int[] {0, 4}),
        FindPairWithSum.findPairWithSum(new int[] {1, 9, 9, 9, 10}, 11));
    checkEquals(
        failures,
        "handles negative values",
        Optional.of(new int[] {0, 4}),
        FindPairWithSum.findPairWithSum(new int[] {-8, -3, 0, 2, 5}, -3));
    checkEquals(
        failures,
        "does not pair the same element with itself",
        Optional.empty(),
        FindPairWithSum.findPairWithSum(new int[] {4, 8}, 8));

    if (!failures.isEmpty()) {
      for (String failure : failures) {
        System.err.println("FAIL: " + failure);
      }
      System.exit(1);
    }

    System.out.println("All checks passed.");
  }

  private static void checkEquals(
      List<String> failures, String name, Optional<int[]> expected, Optional<int[]> actual) {
    boolean equal =
        expected.isPresent() == actual.isPresent()
            && (expected.isEmpty() || Arrays.equals(expected.get(), actual.get()));
    if (!equal) {
      failures.add(name + ": expected " + describe(expected) + " but got " + describe(actual));
    }
  }

  private static String describe(Optional<int[]> value) {
    return value.map(Arrays::toString).orElse("empty");
  }
}
