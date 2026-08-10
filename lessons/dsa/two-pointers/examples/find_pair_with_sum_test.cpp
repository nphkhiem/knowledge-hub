#include <iostream>
#include <optional>
#include <sstream>
#include <string>
#include <utility>
#include <vector>

// A tiny example is easiest to compile as one translation unit rather than
// splitting a declaration into its own header, so the test includes the
// implementation file directly.
#include "find_pair_with_sum.cpp"

namespace {

std::string describe(const std::optional<std::pair<int, int>>& value) {
  if (!value.has_value()) return "nullopt";
  std::ostringstream out;
  out << "(" << value->first << ", " << value->second << ")";
  return out.str();
}

int failureCount = 0;

void checkEquals(
    const std::string& name,
    const std::optional<std::pair<int, int>>& expected,
    const std::optional<std::pair<int, int>>& actual) {
  if (expected != actual) {
    std::cerr << "FAIL: " << name << ": expected " << describe(expected)
              << " but got " << describe(actual) << "\n";
    failureCount += 1;
  }
}

}  // namespace

int main() {
  checkEquals(
      "finds the pair the lesson animates",
      std::make_pair(2, 4),
      find_pair_with_sum({1, 2, 4, 7, 11, 15}, 15));

  checkEquals(
      "reports no pair for an empty array rather than guessing",
      std::nullopt,
      find_pair_with_sum({}, 5));
  checkEquals(
      "reports no pair when none sums to the target",
      std::nullopt,
      find_pair_with_sum({1, 2, 4, 7, 11, 15}, 100));
  checkEquals(
      "reports no pair for a single-element array",
      std::nullopt,
      find_pair_with_sum({5}, 5));

  checkEquals(
      "handles an adjacent pair",
      std::make_pair(0, 1),
      find_pair_with_sum({3, 4}, 7));
  checkEquals(
      "handles a pair at both endpoints",
      std::make_pair(0, 4),
      find_pair_with_sum({1, 9, 9, 9, 10}, 11));
  checkEquals(
      "handles negative values",
      std::make_pair(0, 4),
      find_pair_with_sum({-8, -3, 0, 2, 5}, -3));
  checkEquals(
      "does not pair the same element with itself",
      std::nullopt,
      find_pair_with_sum({4, 8}, 8));

  if (failureCount > 0) {
    return 1;
  }
  std::cout << "All checks passed.\n";
  return 0;
}
