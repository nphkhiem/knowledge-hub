import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Combining overlapping spans, and what happens without the sort.
 *
 * <p>{@code mergeSorted} is the real implementation: sort by start, sweep once.
 * {@code sweepOnly} is the same sweep with the sort removed, which is not a
 * warning in prose but a method whose wrong answers the tests check.
 *
 * <p>Spans that merely touch are merged here. That is a decision rather than a
 * fact, so the comparison is named once and used everywhere.
 */
public final class MergeSpans {
  private MergeSpans() {}

  /** A span with an inclusive start and an exclusive end. */
  public record Span(int start, int end) {}

  /**
   * Whether {@code span} can join {@code group}, given both start no earlier.
   *
   * <p>Change this one comparison to {@code <} and touching spans stay
   * separate, which is right for ranges of distinct identifiers and wrong for
   * calendar bookings.
   */
  public static boolean touchesOrOverlaps(Span group, Span span) {
    return span.start() <= group.end();
  }

  /** Sweep without sorting. Correct only if the caller already sorted. */
  public static List<Span> sweepOnly(List<Span> spans) {
    List<Span> merged = new ArrayList<>();
    if (spans.isEmpty()) {
      return merged;
    }

    merged.add(spans.get(0));
    for (Span span : spans.subList(1, spans.size())) {
      Span group = merged.get(merged.size() - 1);
      if (touchesOrOverlaps(group, span)) {
        // Only the end moves, and it takes the larger of the two. Taking the
        // joining span's end shrinks the group whenever one span nests inside
        // another, which is the classic defect.
        merged.set(
            merged.size() - 1,
            new Span(group.start(), Math.max(group.end(), span.end())));
      } else {
        merged.add(span);
      }
    }

    return merged;
  }

  /** Sort by where each span begins, then sweep once. */
  public static List<Span> mergeSorted(List<Span> spans) {
    List<Span> ordered = new ArrayList<>(spans);
    ordered.sort(Comparator.comparingInt(Span::start));
    return sweepOnly(ordered);
  }

  /** Total length covered, counted from the merged spans. */
  public static int coveredUnits(List<Span> spans) {
    int total = 0;
    for (Span span : mergeSorted(spans)) {
      total += span.end() - span.start();
    }
    return total;
  }

  /** The free spaces between merged spans, from the same pass. */
  public static List<Span> gapsBetween(List<Span> spans) {
    List<Span> merged = mergeSorted(spans);
    List<Span> gaps = new ArrayList<>();
    for (int at = 0; at + 1 < merged.size(); at++) {
      if (merged.get(at + 1).start() > merged.get(at).end()) {
        gaps.add(new Span(merged.get(at).end(), merged.get(at + 1).start()));
      }
    }
    return gaps;
  }

  /** Every unit, checked against every span. Far too slow, and a reference. */
  public static int coveredByBruteForce(List<Span> spans, int spanLimit) {
    int total = 0;
    for (int unit = 0; unit < spanLimit; unit++) {
      for (Span span : spans) {
        if (span.start() <= unit && unit < span.end()) {
          total++;
          break;
        }
      }
    }
    return total;
  }
}
