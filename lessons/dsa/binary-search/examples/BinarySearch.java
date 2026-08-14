import java.util.List;
import java.util.OptionalInt;

/**
 * Searching a sorted list by halving, and by scanning it.
 *
 * <p>Both methods answer the same question. They differ in how many values they
 * look at to answer it, which is the point of the lesson, so each reports the
 * number of values it examined.
 */
public final class BinarySearch {
  private BinarySearch() {}

  /** Where the value was found, and how many values were examined. */
  public record Search(OptionalInt index, int probes) {}

  /** Walk from one end, ignoring the order the values are already in. */
  public static Search byScan(List<Integer> values, int target) {
    for (int index = 0; index < values.size(); index++) {
      if (values.get(index) == target) {
        return new Search(OptionalInt.of(index), index + 1);
      }
    }
    return new Search(OptionalInt.empty(), values.size());
  }

  /** Keep the range that could still hold the target, and halve it. */
  public static Search byHalving(List<Integer> values, int target) {
    int low = 0;
    int high = values.size() - 1;
    int probes = 0;

    while (low <= high) {
      // low + (high - low) / 2, not (low + high) / 2. The sum overflows an int
      // once the indices are large enough; the offset cannot. This exact bug
      // sat in the JDK's own binary search for about twenty years.
      int middle = low + (high - low) / 2;
      int value = values.get(middle);
      probes++;

      if (value == target) {
        return new Search(OptionalInt.of(middle), probes);
      }
      if (value < target) {
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }

    return new Search(OptionalInt.empty(), probes);
  }
}
