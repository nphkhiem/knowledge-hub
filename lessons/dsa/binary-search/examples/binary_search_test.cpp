#include <cmath>
#include <cstdlib>
#include <iostream>
#include <numeric>
#include <vector>

#include "binary_search.cpp"

namespace {
int failures = 0;
const std::vector<int> kValues = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};

void check(const char* name, bool passed) {
  if (!passed) {
    std::cout << "FAIL " << name << "\n";
    ++failures;
  }
}

std::vector<int> range(int size) {
  std::vector<int> values(static_cast<std::size_t>(size));
  std::iota(values.begin(), values.end(), 0);
  return values;
}

int worst(const std::vector<int>& values, const std::vector<int>& targets) {
  int most = 0;
  for (int target : targets) {
    most = std::max(most, byHalving(values, target).probes);
  }
  return most;
}
}  // namespace

int main() {
  // Deliberately not "the same index as a scan": with duplicates the two can
  // differ and both be right. What must hold is that the answer is an answer.
  for (int value : kValues) {
    const Search found = byHalving(kValues, value);
    check("finds a position holding the value",
          found.index.has_value() &&
              kValues[static_cast<std::size_t>(*found.index)] == value);
  }

  for (int absent : {-4, 0, 1, 3, 24, 90, 92, 1000}) {
    check("absent by halving", !byHalving(kValues, absent).index.has_value());
    check("absent by scan", !byScan(kValues, absent).index.has_value());
  }

  const Search lesson = byHalving(kValues, 23);
  check("the lesson search", lesson.index == 5 && lesson.probes == 3);

  // The claim the lesson makes, as a bound rather than an anecdote.
  const int bound =
      static_cast<int>(std::log2(static_cast<double>(kValues.size()))) + 1;
  for (int target : {2, 23, 91, -1, 7, 100}) {
    check("within the bound", byHalving(kValues, target).probes <= bound);
  }

  const int last = kValues.back();
  check("a scan examines far more at the far end",
        byScan(kValues, last).probes > byHalving(kValues, last).probes);

  check("doubling the input adds one look",
        worst(range(2048), {0, 1023, 2047}) - worst(range(1024), {0, 511, 1023}) == 1);

  check("finds the first", byHalving(kValues, kValues.front()).index == 0);
  check("finds the last",
        byHalving(kValues, last).index == static_cast<int>(kValues.size()) - 1);

  const Search empty = byHalving({}, 3);
  check("an empty vector holds nothing", !empty.index.has_value() && empty.probes == 0);

  check("a single value vector, present", byHalving({7}, 7).index == 0);
  check("a single value vector, absent", !byHalving({7}, 8).index.has_value());

  const std::vector<int> repeated = {1, 4, 4, 4, 9};
  const Search duplicate = byHalving(repeated, 4);
  check("duplicates return a position holding the target",
        duplicate.index.has_value() &&
            repeated[static_cast<std::size_t>(*duplicate.index)] == 4);

  const std::vector<int> signed_values = {-9, -4, -1, 0, 6};
  for (int value : signed_values) {
    const Search found = byHalving(signed_values, value);
    check("negative values are ordered too",
          found.index.has_value() &&
              signed_values[static_cast<std::size_t>(*found.index)] == value);
  }

  if (failures > 0) {
    return EXIT_FAILURE;
  }
  std::cout << "All checks passed.\n";
  return EXIT_SUCCESS;
}
