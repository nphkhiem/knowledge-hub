// Range totals, computed directly and through prefix sums.
//
// The prefix vector carries a leading zero, so entry i holds the total of the
// first i values and a range needs no special case when it starts at 0.
#include <vector>

// One pass. Entry i holds the total of the first i values.
std::vector<int> buildPrefix(const std::vector<int>& values) {
  std::vector<int> prefix = {0};
  for (int value : values) {
    prefix.push_back(prefix.back() + value);
  }
  return prefix;
}

// Add the range every time it is asked for.
int rangeTotalByScan(const std::vector<int>& values, int start, int end) {
  int total = 0;
  for (int index = start; index <= end; ++index) {
    total += values[static_cast<std::size_t>(index)];
  }
  return total;
}

// Two reads and a subtraction, whatever the range covers.
int rangeTotalByPrefix(const std::vector<int>& prefix, int start, int end) {
  return prefix[static_cast<std::size_t>(end + 1)] - prefix[static_cast<std::size_t>(start)];
}
