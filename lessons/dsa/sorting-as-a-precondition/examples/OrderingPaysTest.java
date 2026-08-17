import java.util.ArrayList;
import java.util.List;
import java.util.OptionalInt;

public final class OrderingPaysTest {
  private static int failures = 0;
  private static final List<Integer> ARRIVED = List.of(38, 5, 91, 23, 8);
  private static final List<Integer> ORDERED = List.of(5, 8, 23, 38, 91);

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

  private static int worstHalving(List<Integer> values) {
    int worst = 0;
    for (int value : values) {
      worst = Math.max(worst, OrderingPays.byHalving(values, value).comparisons());
    }
    return worst;
  }

  public static void main(String[] args) {
    OrderingPays.Probe lesson = OrderingPays.byScan(ARRIVED, 8);
    check("the lesson scan",
        lesson.index().equals(OptionalInt.of(4)) && lesson.comparisons() == 5);
    check("the lesson halving",
        OrderingPays.byHalving(ORDERED, 8).index().equals(OptionalInt.of(1)));

    // The reason this is a precondition rather than a step. Given the same
    // values in arrival order, the halving search reports the value absent. It
    // does not fail or complain; it returns a confident wrong answer.
    check("halving on unordered values silently lies",
        OrderingPays.byHalving(ARRIVED, 8).index().isEmpty());
    check("a scan still finds it",
        OrderingPays.byScan(ARRIVED, 8).index().equals(OptionalInt.of(4)));

    for (int absent : new int[] {0, 100}) {
      check("scanning examines every value",
          OrderingPays.byScan(ARRIVED, absent).comparisons() == ARRIVED.size());
    }

    // Eight times the values, three more comparisons, not eight times as many.
    List<Integer> small = range(128);
    List<Integer> large = range(1024);
    check("growth is three more comparisons",
        worstHalving(large) - worstHalving(small) == 3);
    check("scanning to the far end reads every value",
        OrderingPays.byScan(large, 1023).comparisons() == 1024);
    check("halving never exceeds the halvings that reach one",
        worstHalving(large) == 11);

    // A scan reads at most every value once. Any sort must read every value at
    // least once, so for a single question the scan cannot lose.
    List<Integer> single = range(512);
    check("one question does not repay the ordering",
        OrderingPays.byScan(single, 511).comparisons() <= single.size());

    List<OrderingPays.Placed> placed = OrderingPays.sortedWithOrigin(ARRIVED);
    List<Integer> values = new ArrayList<>();
    List<Integer> origins = new ArrayList<>();
    for (OrderingPays.Placed entry : placed) {
      values.add(entry.value());
      origins.add(entry.origin());
    }
    check("ordering keeps the values", values.equals(ORDERED));
    check("carrying the position is the only way back",
        origins.equals(List.of(1, 4, 3, 0, 2)));

    // Stability, stated as a test. The two 7s must come back in the order they
    // arrived, which is what lets two sorts be combined.
    List<Integer> sevens = new ArrayList<>();
    for (OrderingPays.Placed entry : OrderingPays.sortedWithOrigin(List.of(7, 3, 7, 1))) {
      if (entry.value() == 7) {
        sevens.add(entry.origin());
      }
    }
    check("equal values keep their arrival order", sevens.equals(List.of(0, 2)));

    check("an empty collection orders to nothing",
        OrderingPays.sortedWithOrigin(List.of()).isEmpty());
    check("halving an empty collection",
        OrderingPays.byHalving(List.of(), 1).index().isEmpty());
    check("a single value",
        OrderingPays.byHalving(List.of(9), 9).index().equals(OptionalInt.of(0)));

    if (failures > 0) {
      System.exit(1);
    }
    System.out.println("All checks passed.");
  }
}
