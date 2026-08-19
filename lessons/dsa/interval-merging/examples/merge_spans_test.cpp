#include <cstdlib>
#include <iostream>
#include <random>
#include <vector>

#include "merge_spans.cpp"

namespace {
int failures = 0;
const std::vector<Span> kBookings = {{1, 3}, {2, 6}, {5, 8}, {10, 12}, {11, 13}};

void check(const char* name, bool passed) {
  if (!passed) {
    std::cout << "FAIL " << name << "\n";
    ++failures;
  }
}
}  // namespace

int main() {
  check("the lesson bookings", mergeSorted(kBookings) == std::vector<Span>({{1, 8}, {10, 13}}));
  check("a gap closes a group", gapsBetween(kBookings) == std::vector<Span>({{8, 10}}));

  // The classic defect: taking the joining span's end rather than the larger of
  // the two. Invisible until one span nests inside another.
  check("a span inside another does not shrink it",
        mergeSorted({{1, 9}, {2, 4}}) == std::vector<Span>({{1, 9}}));

  // A decision rather than a fact, pinned so a caller knows which.
  check("touching spans merge", mergeSorted({{1, 4}, {4, 7}}) == std::vector<Span>({{1, 7}}));

  // Not a warning in prose. The unsorted sweep returns a plausible, shorter
  // list of real spans, and it is wrong.
  const std::vector<Span> shuffled = {{10, 12}, {1, 3}, {2, 6}};
  check("sorting first gives the right answer",
        mergeSorted(shuffled) == std::vector<Span>({{1, 6}, {10, 12}}));
  check("the sort is a precondition", !(sweepOnly(shuffled) == mergeSorted(shuffled)));

  // The property, against a reference too slow to use, over random input.
  std::mt19937 random(11);
  for (int attempt = 0; attempt < 200; ++attempt) {
    std::vector<Span> built;
    const int count = static_cast<int>(random() % 7);
    for (int at = 0; at < count; ++at) {
      const int start = static_cast<int>(random() % 19);
      built.push_back(Span{start, start + static_cast<int>(random() % 6)});
    }
    check("merging agrees with counting every unit",
          coveredUnits(built) == coveredByBruteForce(built, 30));

    const std::vector<Span> merged = mergeSorted(built);
    for (std::size_t at = 0; at + 1 < merged.size(); ++at) {
      // Sorted, and separated by a real gap rather than touching.
      check("merged spans are sorted and disjoint", merged[at].end < merged[at + 1].start);
    }
  }

  check("no spans", mergeSorted({}).empty());
  check("identical spans collapse to one",
        mergeSorted({{2, 5}, {2, 5}, {2, 5}}) == std::vector<Span>({{2, 5}}));

  // A booking of no duration is still a real record.
  check("a zero length span is kept", mergeSorted({{4, 4}}) == std::vector<Span>({{4, 4}}));

  if (failures > 0) {
    return EXIT_FAILURE;
  }
  std::cout << "All checks passed.\n";
  return EXIT_SUCCESS;
}
