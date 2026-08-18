// The longest stretch whose total stays within a budget, in one pass.
//
// Both search functions answer the same question. One tries every start
// position and extends from it; the other moves two edges that never go
// backward. Each reports how many values it looked at, because the difference
// between them is the point.
//
// byWindow assumes non-negative values. byExhaustive assumes nothing and is far
// too slow to use, which is what makes it a reference.
#include <algorithm>
#include <vector>

// The longest width found, and how many values were examined.
struct Search {
  int width;
  int reads;
};

// Try each start position and extend from it. Re-reads what it already saw.
Search byEveryStart(const std::vector<int>& values, int budget) {
  int best = 0;
  int reads = 0;
  const int size = static_cast<int>(values.size());

  for (int start = 0; start < size; ++start) {
    int total = 0;
    for (int end = start; end < size; ++end) {
      total += values[static_cast<std::size_t>(end)];
      ++reads;
      if (total > budget) {
        break;
      }
      best = std::max(best, end - start + 1);
    }
  }

  return Search{best, reads};
}

// Move two edges, neither ever backward. One pass over the values.
Search byWindow(const std::vector<int>& values, int budget) {
  int best = 0;
  int total = 0;
  int start = 0;
  int reads = 0;
  const int size = static_cast<int>(values.size());

  for (int end = 0; end < size; ++end) {
    total += values[static_cast<std::size_t>(end)];
    ++reads;

    // The front edge comes up only while the budget is broken, and stops as
    // soon as it holds. Both halves need the condition to be one-way.
    while (total > budget && start <= end) {
      total -= values[static_cast<std::size_t>(start)];
      ++reads;
      ++start;
    }

    best = std::max(best, end - start + 1);
  }

  return Search{best, reads};
}

// Every stretch, with no early exit. Correct on any values, and far too slow to
// use. It exists so the tests have something to be right against.
int byExhaustive(const std::vector<int>& values, int budget) {
  int best = 0;
  const int size = static_cast<int>(values.size());

  for (int start = 0; start < size; ++start) {
    int total = 0;
    for (int end = start; end < size; ++end) {
      total += values[static_cast<std::size_t>(end)];
      if (total <= budget) {
        best = std::max(best, end - start + 1);
      }
    }
  }

  return best;
}
