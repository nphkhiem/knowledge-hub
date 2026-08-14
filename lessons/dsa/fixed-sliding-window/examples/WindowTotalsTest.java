import java.util.List;
import java.util.OptionalInt;

public final class WindowTotalsTest {
  private static int failures = 0;
  private static final List<Integer> VALUES = List.of(5, 1, 8, 2, 3, 7);
  private static final int WIDTH = 3;

  private static void check(String name, boolean passed) {
    if (!passed) {
      System.out.println("FAIL " + name);
      failures++;
    }
  }

  public static void main(String[] args) {
    for (int width = 1; width <= VALUES.size(); width++) {
      check("approaches agree at width " + width,
          WindowTotals.bySliding(VALUES, width).totals()
              .equals(WindowTotals.byRescan(VALUES, width).totals()));
    }

    check("the lesson windows",
        WindowTotals.bySliding(VALUES, WIDTH).totals().equals(List.of(14, 11, 13, 12)));
    check("the largest window is the first",
        WindowTotals.bestWindowTotal(VALUES, WIDTH).equals(OptionalInt.of(14)));

    // The property the lesson teaches: a move removes one value and adds one,
    // whatever the width.
    for (int width = 1; width <= VALUES.size(); width++) {
      WindowTotals.WindowScan scan = WindowTotals.bySliding(VALUES, width);
      int moves = scan.totals().size() - 1;
      check("every move costs two at width " + width, scan.operations() - width == 2 * moves);
    }

    for (int width = 3; width < VALUES.size(); width++) {
      check("sliding does less arithmetic at width " + width,
          WindowTotals.bySliding(VALUES, width).operations()
              < WindowTotals.byRescan(VALUES, width).operations());
    }

    // A window as wide as the sequence never moves, so there is nothing to
    // repair and both approaches do identical work.
    check("one window saves nothing",
        WindowTotals.bySliding(VALUES, VALUES.size()).operations()
            == WindowTotals.byRescan(VALUES, VALUES.size()).operations());

    // Honest edge: with nothing overlapping, the repair costs more than the
    // rebuild it replaces.
    check("repairing is not worth it at width one",
        WindowTotals.bySliding(VALUES, 1).operations()
            > WindowTotals.byRescan(VALUES, 1).operations());

    check("a window as wide as the sequence has one position",
        WindowTotals.bySliding(VALUES, VALUES.size()).totals().equals(List.of(26)));
    check("a window wider than the sequence has none",
        WindowTotals.bySliding(VALUES, VALUES.size() + 1).totals().isEmpty());
    check("no best window when none fits",
        WindowTotals.bestWindowTotal(VALUES, VALUES.size() + 1).isEmpty());
    check("an empty sequence has no windows",
        WindowTotals.bySliding(List.of(), 3).totals().isEmpty());
    check("a width of zero has no windows", WindowTotals.windowCount(VALUES.size(), 0) == 0);
    check("a negative width has no windows",
        WindowTotals.byRescan(VALUES, -1).totals().isEmpty());
    check("negative values repair correctly",
        WindowTotals.bySliding(List.of(4, -2, 6, -1), 2).totals()
            .equals(WindowTotals.byRescan(List.of(4, -2, 6, -1), 2).totals()));

    if (failures > 0) {
      System.exit(1);
    }
    System.out.println("All checks passed.");
  }
}
