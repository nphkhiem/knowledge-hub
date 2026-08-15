import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;

/**
 * Last-in, first-out order, and one thing it is genuinely needed for.
 *
 * <p>{@code drain} exists to state the defining property: what comes out is
 * what went in, reversed. {@code isBalanced} exists because that property does
 * real work there, and a counter of opens and closes cannot do the same job.
 */
public final class LastInOrder {
  private LastInOrder() {}

  private static final Map<Character, Character> PAIRS =
      Map.of(')', '(', ']', '[', '}', '{');
  private static final String OPENERS = "([{";

  /** Push everything, then pop everything. The order reverses. */
  public static List<String> drain(List<String> items) {
    Deque<String> pile = new ArrayDeque<>();
    for (String item : items) {
      pile.push(item);
    }

    List<String> out = new ArrayList<>();
    while (!pile.isEmpty()) {
      out.add(pile.pop());
    }
    return out;
  }

  /** Whether every bracket closes the one most recently left open. */
  public static boolean isBalanced(String text) {
    Deque<Character> pile = new ArrayDeque<>();

    for (char character : text.toCharArray()) {
      if (OPENERS.indexOf(character) >= 0) {
        pile.push(character);
        continue;
      }
      Character opener = PAIRS.get(character);
      if (opener == null) {
        continue;
      }
      // Two distinct failures: nothing is open, or the wrong thing is.
      if (pile.isEmpty() || !pile.peek().equals(opener)) {
        return false;
      }
      pile.pop();
    }

    // Anything still open never closed.
    return pile.isEmpty();
  }

  /** How deep the pile ever got, which is the space this really costs. */
  public static int deepestNesting(String text) {
    int depth = 0;
    int deepest = 0;

    for (char character : text.toCharArray()) {
      if (OPENERS.indexOf(character) >= 0) {
        depth++;
        deepest = Math.max(deepest, depth);
      } else if (PAIRS.containsKey(character) && depth > 0) {
        depth--;
      }
    }

    return deepest;
  }
}
