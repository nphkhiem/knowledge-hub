#include <cstdlib>
#include <iostream>
#include <optional>
#include <vector>

#include "next_warmer.cpp"

namespace {
int failures = 0;
const std::vector<int> kHighs = {30, 28, 33, 31, 35};

void check(const char* name, bool passed) {
  if (!passed) {
    std::cout << "FAIL " << name << "\n";
    ++failures;
  }
}

std::vector<int> rising(int length) {
  std::vector<int> values;
  for (int at = 0; at < length; ++at) values.push_back(at);
  return values;
}

std::vector<int> falling(int length) {
  std::vector<int> values;
  for (int at = 0; at < length; ++at) values.push_back(length - at);
  return values;
}
}  // namespace

int main() {
  const std::vector<std::optional<int>> expected = {2, 1, 2, 1, std::nullopt};
  check("the lesson readings", byOrderedPile(kHighs).waits == expected);

  const std::vector<std::vector<int>> shapes = {
      {}, {5}, kHighs, {1, 2, 3, 4}, {4, 3, 2, 1},
      {7, 7, 7}, {2, 1, 2, 1, 2}, {10, 1, 9, 2, 8, 3}};
  for (const std::vector<int>& highs : shapes) {
    check("both approaches agree",
          byOrderedPile(highs).waits == byComparingPairs(highs).waits);
  }

  // The claim the lesson makes. One reading can pop many, so the bound is over
  // the whole pass rather than any single step.
  for (int length : {1, 5, 20, 60}) {
    for (const std::vector<int>& highs : {rising(length), falling(length)}) {
      check("pushed once, popped at most once",
            byOrderedPile(highs).comparisons <= 2 * static_cast<int>(highs.size()));
    }
  }

  // The worst case for pairs: no day is ever answered.
  const std::vector<int> steep = falling(40);
  check("comparing pairs is quadratic",
        byComparingPairs(steep).comparisons > 10 * static_cast<int>(steep.size()));
  check("the pile stays linear",
        byOrderedPile(steep).comparisons <= 2 * static_cast<int>(steep.size()));

  const std::vector<std::optional<int>> nobody = {std::nullopt, std::nullopt, std::nullopt};
  check("a falling sequence answers nobody", byOrderedPile({5, 4, 3}).waits == nobody);

  // Warmer means strictly warmer. Equal temperatures leave both waiting.
  const std::vector<std::optional<int>> equalDays = {2, 1, std::nullopt};
  check("equal days do not answer each other", byOrderedPile({7, 7, 8}).waits == equalDays);

  // A result rather than an error, and distinct from a distance of zero.
  for (const std::vector<int>& highs : {kHighs, {1, 2, 3}, {3, 2, 1}, {9}}) {
    check("the last day never has an answer", !byOrderedPile(highs).waits.back().has_value());
  }

  check("an empty history", byOrderedPile({}).waits.empty());

  if (failures > 0) {
    return EXIT_FAILURE;
  }
  std::cout << "All checks passed.\n";
  return EXIT_SUCCESS;
}
