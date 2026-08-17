import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.OptionalInt;

/**
 * What ordering buys a later search, and what it costs to get it.
 *
 * <p>The sort itself is the library's own, because the lesson is about treating
 * order as a precondition rather than about how to establish it. What is
 * measured here is the work of the questions that follow.
 */
public final class OrderingPays {
  private OrderingPays() {}

  /** Where the value was found, and how many values were examined. */
  public record Probe(OptionalInt index, int comparisons) {}

  /** A value and the position it occupied before anything was ordered. */
  public record Placed(int value, int origin) {}

  /** Examine values in the order given. Nothing rules anything out. */
  public static Probe byScan(List<Integer> values, int target) {
    for (int index = 0; index < values.size(); index++) {
      if (values.get(index) == target) {
        return new Probe(OptionalInt.of(index), index + 1);
      }
    }
    return new Probe(OptionalInt.empty(), values.size());
  }

  /** Halve the range each time. Correct only if {@code values} is ordered. */
  public static Probe byHalving(List<Integer> values, int target) {
    int low = 0;
    int high = values.size() - 1;
    int comparisons = 0;

    while (low <= high) {
      int middle = low + (high - low) / 2;
      int value = values.get(middle);
      comparisons++;

      if (value == target) {
        return new Probe(OptionalInt.of(middle), comparisons);
      }
      if (value < target) {
        low = middle + 1;
      } else {
        high = middle - 1;
      }
    }

    return new Probe(OptionalInt.empty(), comparisons);
  }

  /**
   * Order the values while carrying where each one started.
   *
   * <p>Sorting values alone destroys the arrival order. Carrying the position is
   * the only way back, and it has to be done before the sort, not after. {@code
   * List.sort} is stable, so equal values keep their original relative order.
   */
  public static List<Placed> sortedWithOrigin(List<Integer> values) {
    List<Placed> placed = new ArrayList<>();
    for (int origin = 0; origin < values.size(); origin++) {
      placed.add(new Placed(values.get(origin), origin));
    }
    placed.sort(Comparator.comparingInt(Placed::value));
    return placed;
  }
}
