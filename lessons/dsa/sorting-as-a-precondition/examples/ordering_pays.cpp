// What ordering buys a later search, and what it costs to get it.
//
// The sort itself is the library's own, because the lesson is about treating
// order as a precondition rather than about how to establish it. What is
// measured here is the work of the questions that follow.
#include <algorithm>
#include <optional>
#include <vector>

// Where the value was found, and how many values were examined.
struct Probe {
  std::optional<int> index;
  int comparisons;
};

// A value and the position it occupied before anything was ordered.
struct Placed {
  int value;
  int origin;
};

// Examine values in the order given. Nothing rules anything out.
Probe byScan(const std::vector<int>& values, int target) {
  for (int index = 0; index < static_cast<int>(values.size()); ++index) {
    if (values[static_cast<std::size_t>(index)] == target) {
      return Probe{index, index + 1};
    }
  }
  return Probe{std::nullopt, static_cast<int>(values.size())};
}

// Halve the range each time. Correct only if `values` is ordered.
Probe byHalving(const std::vector<int>& values, int target) {
  int low = 0;
  int high = static_cast<int>(values.size()) - 1;
  int comparisons = 0;

  while (low <= high) {
    const int middle = low + (high - low) / 2;
    const int value = values[static_cast<std::size_t>(middle)];
    ++comparisons;

    if (value == target) {
      return Probe{middle, comparisons};
    }
    if (value < target) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return Probe{std::nullopt, comparisons};
}

// Order the values while carrying where each one started.
//
// Sorting values alone destroys the arrival order. Carrying the position is the
// only way back, and it has to be done before the sort, not after. stable_sort
// is used deliberately so equal values keep their original relative order.
std::vector<Placed> sortedWithOrigin(const std::vector<int>& values) {
  std::vector<Placed> placed;
  placed.reserve(values.size());
  for (int origin = 0; origin < static_cast<int>(values.size()); ++origin) {
    placed.push_back(Placed{values[static_cast<std::size_t>(origin)], origin});
  }

  std::stable_sort(placed.begin(), placed.end(),
                   [](const Placed& left, const Placed& right) {
                     return left.value < right.value;
                   });
  return placed;
}
