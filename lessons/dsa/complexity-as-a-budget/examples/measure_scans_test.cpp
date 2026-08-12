#include <cstdlib>
#include <iostream>
#include <vector>

#include "measure_scans.cpp"

namespace {
int failures = 0;

void check(const char* name, int actual, int expected) {
  if (actual != expected) {
    std::cout << "FAIL " << name << ": expected " << expected << " got " << actual << "\n";
    ++failures;
  }
}
}  // namespace

int main() {
  // Four distinct items make 4 * 3 / 2 = 6 pairs.
  check("pairwise spends a step per pair", stepsForPairwiseScan({3, 8, 2, 5}), 6);
  check("pairwise on four", stepsForPairwiseScan({1, 2, 3, 4}), 6);
  check("pairwise on eight", stepsForPairwiseScan({1, 2, 3, 4, 5, 6, 7, 8}), 28);
  check("single spends a step per item", stepsForSingleScan({3, 8, 2, 5}), 4);
  check("single on eight", stepsForSingleScan({1, 2, 3, 4, 5, 6, 7, 8}), 8);
  check("pairwise stops early", stepsForPairwiseScan({1, 1, 2, 3}), 1);
  check("single stops early", stepsForSingleScan({1, 1, 2, 3}), 2);
  check("empty pairwise", stepsForPairwiseScan({}), 0);
  check("empty single", stepsForSingleScan({}), 0);

  if (failures > 0) {
    return EXIT_FAILURE;
  }
  std::cout << "All checks passed.\n";
  return EXIT_SUCCESS;
}
