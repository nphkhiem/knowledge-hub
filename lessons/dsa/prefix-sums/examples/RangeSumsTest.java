import java.util.List;

public final class RangeSumsTest {
  private static int failures = 0;
  private static final List<Integer> VALUES = List.of(3, 1, 4, 1, 5, 9);

  private static void check(String name, boolean passed) {
    if (!passed) {
      System.out.println("FAIL " + name);
      failures++;
    }
  }

  public static void main(String[] args) {
    List<Integer> prefix = RangeSums.buildPrefix(VALUES);

    for (int start = 0; start < VALUES.size(); start++) {
      for (int end = start; end < VALUES.size(); end++) {
        check("ranges agree",
            RangeSums.rangeTotalByPrefix(prefix, start, end)
                == RangeSums.rangeTotalByScan(VALUES, start, end));
      }
    }

    check("the lesson range totals ten", RangeSums.rangeTotalByPrefix(prefix, 2, 4) == 10);
    check("a range starting at zero", RangeSums.rangeTotalByPrefix(prefix, 0, 0) == 3);
    check("the whole sequence",
        RangeSums.rangeTotalByPrefix(prefix, 0, VALUES.size() - 1) == 23);
    check("prefix is one longer", prefix.size() == VALUES.size() + 1);
    check("an empty sequence", RangeSums.buildPrefix(List.of()).equals(List.of(0)));
    check("negative values",
        RangeSums.rangeTotalByPrefix(RangeSums.buildPrefix(List.of(5, -3, 2)), 0, 2) == 4);

    if (failures > 0) {
      System.exit(1);
    }
    System.out.println("All checks passed.");
  }
}
