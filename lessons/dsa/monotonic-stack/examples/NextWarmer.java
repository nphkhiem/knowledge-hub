import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.OptionalInt;

/**
 * How many days until a warmer one, by ordered pile and by comparing pairs.
 *
 * <p>Both answer the same question. The pile reads the days once; the pairwise
 * version compares every day with every later day, which is what the ordering
 * removes. Each reports how many comparisons it made.
 *
 * <p>A day with no warmer day after it has no answer, which is a result rather
 * than an error, so both return an empty optional rather than a sentinel.
 */
public final class NextWarmer {
  private NextWarmer() {}

  /** Days until warmer for each day, and the comparisons it took. */
  public record Report(List<OptionalInt> waits, int comparisons) {}

  /** Look ahead from every day. Correct, and grows with the square. */
  public static Report byComparingPairs(List<Integer> highs) {
    List<OptionalInt> waits = new ArrayList<>();
    int comparisons = 0;

    for (int day = 0; day < highs.size(); day++) {
      OptionalInt found = OptionalInt.empty();
      for (int later = day + 1; later < highs.size(); later++) {
        comparisons++;
        if (highs.get(later) > highs.get(day)) {
          found = OptionalInt.of(later - day);
          break;
        }
      }
      waits.add(found);
    }

    return new Report(waits, comparisons);
  }

  /**
   * Keep unanswered days on a pile in decreasing order. One pass.
   *
   * <p>The pile holds positions rather than temperatures, because the answer is
   * a distance and a position can produce both. See the deep dive.
   */
  public static Report byOrderedPile(List<Integer> highs) {
    List<OptionalInt> waits = new ArrayList<>();
    for (int at = 0; at < highs.size(); at++) {
      waits.add(OptionalInt.empty());
    }

    Deque<Integer> waiting = new ArrayDeque<>();
    int comparisons = 0;

    for (int day = 0; day < highs.size(); day++) {
      // Everything this day answers is on top, because the pile is ordered.
      while (!waiting.isEmpty()) {
        comparisons++;
        int top = waiting.peek();
        if (highs.get(top) >= highs.get(day)) {
          break;
        }
        waiting.pop();
        waits.set(top, OptionalInt.of(day - top));
      }
      waiting.push(day);
    }

    // Whatever is still waiting never found a warmer day. That is the answer.
    return new Report(waits, comparisons);
  }
}
