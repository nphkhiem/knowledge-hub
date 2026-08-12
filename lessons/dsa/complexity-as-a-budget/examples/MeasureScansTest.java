public final class MeasureScansTest {
  private static int failures = 0;

  private static void check(String name, int actual, int expected) {
    if (actual != expected) {
      System.out.println("FAIL " + name + ": expected " + expected + " got " + actual);
      failures++;
    }
  }

  public static void main(String[] args) {
    // Four distinct items make 4 * 3 / 2 = 6 pairs.
    check("pairwise spends a step per pair",
        MeasureScans.stepsForPairwiseScan(new int[] {3, 8, 2, 5}), 6);
    check("pairwise on four", MeasureScans.stepsForPairwiseScan(new int[] {1, 2, 3, 4}), 6);
    check("pairwise on eight",
        MeasureScans.stepsForPairwiseScan(new int[] {1, 2, 3, 4, 5, 6, 7, 8}), 28);
    check("single spends a step per item",
        MeasureScans.stepsForSingleScan(new int[] {3, 8, 2, 5}), 4);
    check("single on eight",
        MeasureScans.stepsForSingleScan(new int[] {1, 2, 3, 4, 5, 6, 7, 8}), 8);
    check("pairwise stops early", MeasureScans.stepsForPairwiseScan(new int[] {1, 1, 2, 3}), 1);
    check("single stops early", MeasureScans.stepsForSingleScan(new int[] {1, 1, 2, 3}), 2);
    check("empty pairwise", MeasureScans.stepsForPairwiseScan(new int[] {}), 0);
    check("empty single", MeasureScans.stepsForSingleScan(new int[] {}), 0);

    if (failures > 0) {
      System.exit(1);
    }
    System.out.println("All checks passed.");
  }
}
