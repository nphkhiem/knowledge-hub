import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class LastInOrderTest {
  private static int failures = 0;
  private static final List<String> WORK =
      List.of("render page", "lay out list", "measure row");

  private static void check(String name, boolean passed) {
    if (!passed) {
      System.out.println("FAIL " + name);
      failures++;
    }
  }

  private static List<String> reversed(List<String> items) {
    List<String> copy = new ArrayList<>(items);
    Collections.reverse(copy);
    return copy;
  }

  private static String repeat(String unit, int times) {
    return unit.repeat(times);
  }

  public static void main(String[] args) {
    // The defining property, over many inputs rather than one. A structure that
    // failed this would not be a stack whatever its methods were named.
    List<List<String>> inputs =
        List.of(
            List.of(),
            List.of("only"),
            WORK,
            List.of("a", "b", "c", "d", "e", "f"),
            List.of("same", "same", "same"));
    for (List<String> items : inputs) {
      check("drain reverses " + items.size(),
          LastInOrder.drain(items).equals(reversed(items)));
    }

    check("the lesson order",
        LastInOrder.drain(WORK)
            .equals(List.of("measure row", "lay out list", "render page")));
    check("draining twice restores the original order",
        LastInOrder.drain(LastInOrder.drain(WORK)).equals(WORK));

    for (String text : new String[] {"", "()", "([{}])", "a(b)c[d]e", "(())()"}) {
      check("balanced accepts " + text, LastInOrder.isBalanced(text));
    }

    check("a closer with nothing open", !LastInOrder.isBalanced(")"));
    check("a closer past the end", !LastInOrder.isBalanced("())"));
    check("something left open", !LastInOrder.isBalanced("("));
    check("partly closed", !LastInOrder.isBalanced("([)"));

    // The case a counter of opens and closes cannot detect: the counts match
    // and the nesting is still wrong.
    check("the wrong closer", !LastInOrder.isBalanced("([)]"));
    check("and its counts do match",
        "([)]".chars().filter(c -> c == '(' || c == '[').count() == 2
            && "([)]".chars().filter(c -> c == ')' || c == ']').count() == 2);

    // A thousand pairs in sequence never need more than one slot; ten nested
    // need ten. This is why recursion depth is the thing to reason about.
    check("depth of a flat sequence",
        LastInOrder.deepestNesting(repeat("()", 1000)) == 1);
    check("depth of nesting",
        LastInOrder.deepestNesting(repeat("(", 10) + repeat(")", 10)) == 10);

    check("text without brackets is balanced",
        LastInOrder.isBalanced("no brackets here"));
    check("text without brackets is flat",
        LastInOrder.deepestNesting("no brackets here") == 0);

    if (failures > 0) {
      System.exit(1);
    }
    System.out.println("All checks passed.");
  }
}
