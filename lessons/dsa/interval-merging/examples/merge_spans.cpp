// Combining overlapping spans, and what happens without the sort.
//
// mergeSorted is the real implementation: sort by start, sweep once. sweepOnly
// is the same sweep with the sort removed, which is not a warning in prose but
// a function whose wrong answers the tests check.
//
// Spans that merely touch are merged here. That is a decision rather than a
// fact, so the comparison is named once and used everywhere.
#include <algorithm>
#include <vector>

// A span with an inclusive start and an exclusive end.
struct Span {
  int start;
  int end;

  bool operator==(const Span& other) const {
    return start == other.start && end == other.end;
  }
};

// Whether `span` can join `group`, given both start no earlier than it.
//
// Change this one comparison to `<` and touching spans stay separate, which is
// right for ranges of distinct identifiers and wrong for calendar bookings.
bool touchesOrOverlaps(const Span& group, const Span& span) {
  return span.start <= group.end;
}

// Sweep without sorting. Correct only if the caller already sorted.
std::vector<Span> sweepOnly(const std::vector<Span>& spans) {
  std::vector<Span> merged;
  if (spans.empty()) {
    return merged;
  }

  merged.push_back(spans.front());
  for (std::size_t at = 1; at < spans.size(); ++at) {
    Span& group = merged.back();
    if (touchesOrOverlaps(group, spans[at])) {
      // Only the end moves, and it takes the larger of the two. Taking the
      // joining span's end shrinks the group whenever one span nests inside
      // another, which is the classic defect.
      group.end = std::max(group.end, spans[at].end);
    } else {
      merged.push_back(spans[at]);
    }
  }

  return merged;
}

// Sort by where each span begins, then sweep once.
std::vector<Span> mergeSorted(const std::vector<Span>& spans) {
  std::vector<Span> ordered = spans;
  std::sort(ordered.begin(), ordered.end(),
            [](const Span& left, const Span& right) { return left.start < right.start; });
  return sweepOnly(ordered);
}

// Total length covered, counted from the merged spans.
int coveredUnits(const std::vector<Span>& spans) {
  int total = 0;
  for (const Span& span : mergeSorted(spans)) {
    total += span.end - span.start;
  }
  return total;
}

// The free spaces between merged spans, from the same pass.
std::vector<Span> gapsBetween(const std::vector<Span>& spans) {
  const std::vector<Span> merged = mergeSorted(spans);
  std::vector<Span> gaps;
  for (std::size_t at = 0; at + 1 < merged.size(); ++at) {
    if (merged[at + 1].start > merged[at].end) {
      gaps.push_back(Span{merged[at].end, merged[at + 1].start});
    }
  }
  return gaps;
}

// Every unit, checked against every span. Far too slow, and a reference.
int coveredByBruteForce(const std::vector<Span>& spans, int spanLimit) {
  int total = 0;
  for (int unit = 0; unit < spanLimit; ++unit) {
    for (const Span& span : spans) {
      if (span.start <= unit && unit < span.end) {
        ++total;
        break;
      }
    }
  }
  return total;
}
