#include <cstdlib>
#include <iostream>
#include <vector>

#include "range_sums.cpp"

namespace {
int failures = 0;
const std::vector<int> kValues = {3, 1, 4, 1, 5, 9};

void check(const char* name, bool passed) {
  if (!passed) {
    std::cout << "FAIL " << name << "\n";
    ++failures;
  }
}
}  // namespace

int main() {
  const std::vector<int> prefix = buildPrefix(kValues);
  const int size = static_cast<int>(kValues.size());

  for (int start = 0; start < size; ++start) {
    for (int end = start; end < size; ++end) {
      check("ranges agree",
            rangeTotalByPrefix(prefix, start, end) == rangeTotalByScan(kValues, start, end));
    }
  }

  check("the lesson range totals ten", rangeTotalByPrefix(prefix, 2, 4) == 10);
  check("a range starting at zero", rangeTotalByPrefix(prefix, 0, 0) == 3);
  check("the whole sequence", rangeTotalByPrefix(prefix, 0, size - 1) == 23);
  check("prefix is one longer", prefix.size() == kValues.size() + 1);
  check("an empty sequence", buildPrefix({}).size() == 1);
  check("negative values", rangeTotalByPrefix(buildPrefix({5, -3, 2}), 0, 2) == 4);

  if (failures > 0) {
    return EXIT_FAILURE;
  }
  std::cout << "All checks passed.\n";
  return EXIT_SUCCESS;
}
