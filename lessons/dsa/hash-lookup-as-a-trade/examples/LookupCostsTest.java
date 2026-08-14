import java.util.ArrayList;
import java.util.List;

public final class LookupCostsTest {
  private static int failures = 0;
  private static final List<String> KEYS =
      List.of("cat", "dog", "emu", "fox", "owl", "bat", "ant", "cow");

  private static void check(String name, boolean passed) {
    if (!passed) {
      System.out.println("FAIL " + name);
      failures++;
    }
  }

  public static void main(String[] args) {
    check("scan reaches the wanted key", LookupCosts.keysExaminedByScan(KEYS, "owl") == 5);
    check("scan examines all when absent",
        LookupCosts.keysExaminedByScan(KEYS, "yak") == KEYS.size());
    check("hash examines only its slot", LookupCosts.keysExaminedByHash(KEYS, "owl", 16) < 3);
    check("absent key examines only its slot",
        LookupCosts.keysExaminedByHash(KEYS, "yak", 16) < 3);

    List<String> larger = new ArrayList<>(KEYS);
    for (int index = 0; index < 200; index++) {
      larger.add("key" + index);
    }
    check("hash stays cheap as the collection grows",
        LookupCosts.keysExaminedByHash(larger, "owl", 512) < 3);
    check("scan does not", LookupCosts.keysExaminedByScan(larger, "owl") > 3);

    check("a slot is stable", LookupCosts.hashSlot("cat", 6) == LookupCosts.hashSlot("cat", 6));
    for (String key : KEYS) {
      check("a slot is inside the table",
          LookupCosts.hashSlot(key, 6) >= 0 && LookupCosts.hashSlot(key, 6) < 6);
    }

    if (failures > 0) {
      System.exit(1);
    }
    System.out.println("All checks passed.");
  }
}
