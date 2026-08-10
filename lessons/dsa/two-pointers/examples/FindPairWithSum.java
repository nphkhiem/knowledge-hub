import java.util.Optional;

/** Two pointers moving inward across an ascending-sorted sequence. */
public final class FindPairWithSum {

  private FindPairWithSum() {}

  /**
   * Returns the indices of the two values that add to {@code target}.
   *
   * <p>{@code values} must be sorted in ascending order. Returns an empty {@code Optional} when
   * no pair sums to the target. Runs in O(n) time and O(1) additional space.
   */
  public static Optional<int[]> findPairWithSum(int[] values, int target) {
    int left = 0;
    int right = values.length - 1;

    while (left < right) {
      int total = values[left] + values[right];
      if (total == target) {
        return Optional.of(new int[] {left, right});
      }

      // The larger value cannot pair with anything still in range, so drop it.
      if (total > target) {
        right -= 1;
      } else {
        left += 1;
      }
    }

    return Optional.empty();
  }
}
