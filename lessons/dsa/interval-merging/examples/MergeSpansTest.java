import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;

public final class MergeSpansTest {
  private static int failures = 0;
  private static final List<MergeSpans.Span> BOOKINGS =
      List.of(
          new MergeSpans.Span(1, 3),
          new MergeSpans.Span(2, 6),
          new MergeSpans.Span(5, 8),
          new MergeSpans.Span(10, 12),
          new MergeSpans.Span(11, 13));

  private static void check(String name, boolean passed) {
    if (!passed) {
      System.out.println("FAIL " + name);
      failures++;
    }
  }

  private static List<MergeSpans.Span> spans(int... bounds) {
    List<MergeSpans.Span> built = new ArrayList<>();
    for (int at = 0; at < bounds.length; at += 2) {
      built.add(new MergeSpans.Span(bounds[at], bounds[at + 1]));
    }
    return built;
  }

  public static void main(String[] args) {
    check("the lesson bookings",
        MergeSpans.mergeSorted(BOOKINGS).equals(spans(1, 8, 10, 13)));
    check("a gap closes a group",
        MergeSpans.gapsBetween(BOOKINGS).equals(spans(8, 10)));

    // The classic defect: taking the joining span's end rather than the larger
    // of the two. Invisible until one span nests inside another.
    check("a span inside another does not shrink it",
        MergeSpans.mergeSorted(spans(1, 9, 2, 4)).equals(spans(1, 9)));

    // A decision rather than a fact, pinned so a caller knows which.
    check("touching spans merge",
        MergeSpans.mergeSorted(spans(1, 4, 4, 7)).equals(spans(1, 7)));

    // Not a warning in prose. The unsorted sweep returns a plausible, shorter
    // list of real spans, and it is wrong.
    List<MergeSpans.Span> shuffled = spans(10, 12, 1, 3, 2, 6);
    check("sorting first gives the right answer",
        MergeSpans.mergeSorted(shuffled).equals(spans(1, 6, 10, 12)));
    check("the sort is a precondition",
        !MergeSpans.sweepOnly(shuffled).equals(MergeSpans.mergeSorted(shuffled)));

    // The property, against a reference too slow to use, over random input.
    Random random = new Random(11);
    for (int attempt = 0; attempt < 200; attempt++) {
      List<MergeSpans.Span> built = new ArrayList<>();
      int count = random.nextInt(7);
      for (int at = 0; at < count; at++) {
        int start = random.nextInt(19);
        built.add(new MergeSpans.Span(start, start + random.nextInt(6)));
      }
      check("merging agrees with counting every unit",
          MergeSpans.coveredUnits(built) == MergeSpans.coveredByBruteForce(built, 30));

      List<MergeSpans.Span> merged = MergeSpans.mergeSorted(built);
      for (int at = 0; at + 1 < merged.size(); at++) {
        // Sorted, and separated by a real gap rather than touching.
        check("merged spans are sorted and disjoint",
            merged.get(at).end() < merged.get(at + 1).start());
      }
    }

    check("no spans", MergeSpans.mergeSorted(Collections.emptyList()).isEmpty());
    check("identical spans collapse to one",
        MergeSpans.mergeSorted(spans(2, 5, 2, 5, 2, 5)).equals(spans(2, 5)));

    // A booking of no duration is still a real record, and dropping it silently
    // would lose data the caller supplied.
    check("a zero length span is kept",
        MergeSpans.mergeSorted(spans(4, 4)).equals(spans(4, 4)));

    if (failures > 0) {
      System.exit(1);
    }
    System.out.println("All checks passed.");
  }
}
