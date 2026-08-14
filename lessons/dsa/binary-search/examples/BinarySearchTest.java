import java.util.ArrayList;
import java.util.List;
import java.util.OptionalInt;

public final class BinarySearchTest {
  private static int failures = 0;
  private static final List<Integer> VALUES =
      List.of(2, 5, 8, 12, 16, 23, 38, 56, 72, 91);

  private static void check(String name, boolean passed) {
    if (!passed) {
      System.out.println("FAIL " + name);
      failures++;
    }
  }

  private static List<Integer> range(int size) {
    List<Integer> values = new ArrayList<>(size);
    for (int at = 0; at < size; at++) {
      values.add(at);
    }
    return values;
  }

  private static int worst(List<Integer> values, int... targets) {
    int most = 0;
    for (int target : targets) {
      most = Math.max(most, BinarySearch.byHalving(values, target).probes());
    }
    return most;
  }

  public static void main(String[] args) {
    // Deliberately not "the same index as a scan": with duplicates the two can
    // differ and both be right. What must hold is that the answer is an answer.
    for (int value : VALUES) {
      OptionalInt found = BinarySearch.byHalving(VALUES, value).index();
      check("finds " + value, found.isPresent() && VALUES.get(found.getAsInt()) == value);
    }

    for (int absent : new int[] {-4, 0, 1, 3, 24, 90, 92, 1000}) {
      check("absent " + absent, BinarySearch.byHalving(VALUES, absent).index().isEmpty());
      check("scan agrees " + absent, BinarySearch.byScan(VALUES, absent).index().isEmpty());
    }

    BinarySearch.Search lesson = BinarySearch.byHalving(VALUES, 23);
    check("the lesson search",
        lesson.index().equals(OptionalInt.of(5)) && lesson.probes() == 3);

    // The claim the lesson makes, as a bound rather than an anecdote.
    int bound = (int) (Math.log(VALUES.size()) / Math.log(2)) + 1;
    for (int target : new int[] {2, 23, 91, -1, 7, 100}) {
      check("within the bound for " + target,
          BinarySearch.byHalving(VALUES, target).probes() <= bound);
    }

    int last = VALUES.get(VALUES.size() - 1);
    check("a scan examines far more at the far end",
        BinarySearch.byScan(VALUES, last).probes()
            > BinarySearch.byHalving(VALUES, last).probes());

    check("doubling the input adds one look",
        worst(range(2048), 0, 1023, 2047) - worst(range(1024), 0, 511, 1023) == 1);

    check("finds the first",
        BinarySearch.byHalving(VALUES, VALUES.get(0)).index().equals(OptionalInt.of(0)));
    check("finds the last",
        BinarySearch.byHalving(VALUES, last).index()
            .equals(OptionalInt.of(VALUES.size() - 1)));

    BinarySearch.Search empty = BinarySearch.byHalving(List.of(), 3);
    check("an empty list holds nothing", empty.index().isEmpty() && empty.probes() == 0);

    check("a single value list, present",
        BinarySearch.byHalving(List.of(7), 7).index().equals(OptionalInt.of(0)));
    check("a single value list, absent",
        BinarySearch.byHalving(List.of(7), 8).index().isEmpty());

    List<Integer> repeated = List.of(1, 4, 4, 4, 9);
    OptionalInt duplicate = BinarySearch.byHalving(repeated, 4).index();
    check("duplicates return a position holding the target",
        duplicate.isPresent() && repeated.get(duplicate.getAsInt()) == 4);

    List<Integer> signed = List.of(-9, -4, -1, 0, 6);
    for (int value : signed) {
      OptionalInt found = BinarySearch.byHalving(signed, value).index();
      check("negative " + value,
          found.isPresent() && signed.get(found.getAsInt()) == value);
    }

    if (failures > 0) {
      System.exit(1);
    }
    System.out.println("All checks passed.");
  }
}
