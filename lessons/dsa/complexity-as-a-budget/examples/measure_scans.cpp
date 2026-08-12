// Count the steps two duplicate checks spend on the same input.
//
// The point of the lesson is that the step count, not the wall clock, is what
// grows with the input, so both functions return the comparisons they made.
#include <unordered_set>
#include <vector>

// Compare every item with every later item. Cost grows with n squared.
int stepsForPairwiseScan(const std::vector<int>& values) {
  int steps = 0;
  for (std::size_t left = 0; left < values.size(); ++left) {
    for (std::size_t right = left + 1; right < values.size(); ++right) {
      ++steps;
      if (values[left] == values[right]) {
        return steps;
      }
    }
  }
  return steps;
}

// Read each item once against a set of what was already seen.
int stepsForSingleScan(const std::vector<int>& values) {
  int steps = 0;
  std::unordered_set<int> seen;
  for (int value : values) {
    ++steps;
    if (!seen.insert(value).second) {
      return steps;
    }
  }
  return steps;
}
