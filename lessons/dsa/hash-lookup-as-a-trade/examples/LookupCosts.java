import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Count the slots two membership checks examine on the same keys.
 *
 * <p>The lesson's claim is that hashing removes a scan. Both methods return how
 * many stored keys they had to look at, so the difference is observable.
 */
public final class LookupCosts {
  private LookupCosts() {}

  /** A deliberately simple hash, so the slot for a key is easy to follow. */
  public static int hashSlot(String key, int slots) {
    int total = 0;
    for (int at = 0; at < key.length(); at++) {
      total = (total * 31 + key.charAt(at)) % slots;
    }
    return total;
  }

  /** Compare against each key in turn. Cost grows with the collection. */
  public static int keysExaminedByScan(List<String> keys, String wanted) {
    int examined = 0;
    for (String key : keys) {
      examined++;
      if (key.equals(wanted)) {
        return examined;
      }
    }
    return examined;
  }

  /** Read only the keys that share the wanted key's slot. */
  public static int keysExaminedByHash(List<String> keys, String wanted, int slots) {
    Map<Integer, List<String>> table = new HashMap<>();
    for (String key : keys) {
      table.computeIfAbsent(hashSlot(key, slots), slot -> new ArrayList<>()).add(key);
    }

    int examined = 0;
    for (String key : table.getOrDefault(hashSlot(wanted, slots), List.of())) {
      examined++;
      if (key.equals(wanted)) {
        return examined;
      }
    }
    return examined;
  }
}
