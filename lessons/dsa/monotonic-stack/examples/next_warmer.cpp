// How many days until a warmer one, by ordered pile and by comparing pairs.
//
// Both answer the same question. The pile reads the days once; the pairwise
// version compares every day with every later day, which is what the ordering
// removes. Each reports how many comparisons it made.
//
// A day with no warmer day after it has no answer, which is a result rather
// than an error, so both return nothing for it rather than a sentinel.
#include <optional>
#include <vector>

// Days until warmer for each day, and the comparisons it took.
struct Report {
  std::vector<std::optional<int>> waits;
  int comparisons;
};

// Look ahead from every day. Correct, and grows with the square.
Report byComparingPairs(const std::vector<int>& highs) {
  Report report{{}, 0};
  const int size = static_cast<int>(highs.size());

  for (int day = 0; day < size; ++day) {
    std::optional<int> found;
    for (int later = day + 1; later < size; ++later) {
      ++report.comparisons;
      if (highs[static_cast<std::size_t>(later)] > highs[static_cast<std::size_t>(day)]) {
        found = later - day;
        break;
      }
    }
    report.waits.push_back(found);
  }

  return report;
}

// Keep unanswered days on a pile in decreasing order. One pass.
//
// The pile holds positions rather than temperatures, because the answer is a
// distance and a position can produce both. See the deep dive.
Report byOrderedPile(const std::vector<int>& highs) {
  const int size = static_cast<int>(highs.size());
  Report report{std::vector<std::optional<int>>(static_cast<std::size_t>(size)), 0};
  std::vector<int> waiting;

  for (int day = 0; day < size; ++day) {
    // Everything this day answers is on top, because the pile is ordered.
    while (!waiting.empty()) {
      ++report.comparisons;
      const int top = waiting.back();
      if (highs[static_cast<std::size_t>(top)] >= highs[static_cast<std::size_t>(day)]) {
        break;
      }
      waiting.pop_back();
      report.waits[static_cast<std::size_t>(top)] = day - top;
    }
    waiting.push_back(day);
  }

  // Whatever is still waiting never found a warmer day. That is the answer.
  return report;
}
