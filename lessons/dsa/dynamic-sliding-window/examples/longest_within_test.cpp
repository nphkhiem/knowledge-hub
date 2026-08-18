#include <cstdlib>
#include <iostream>
#include <vector>

#include "longest_within.cpp"

namespace {
int failures = 0;
const std::vector<int> kReadings = {2, 3, 1, 4, 2};
const int kBudget = 6;

void check(const char* name, bool passed) {
  if (!passed) {
    std::cout << "FAIL " << name << "\n";
    ++failures;
  }
}

std::vector<int> repeated(int value, int times) {
  return std::vector<int>(static_cast<std::size_t>(times), value);
}
}  // namespace

int main() {
  check("the lesson readings", byWindow(kReadings, kBudget).width == 3);

  const std::vector<std::vector<int>> sequences = {
      {}, {5}, kReadings, {1, 1, 1, 1}, {0, 0, 4, 0}, {9, 9}};
  for (const std::vector<int>& values : sequences) {
    for (int budget = 0; budget <= 11; ++budget) {
      check("window matches the truth",
            byWindow(values, budget).width == byExhaustive(values, budget));
      check("both approaches agree",
            byWindow(values, budget).width == byEveryStart(values, budget).width);
    }
  }

  // The property the lesson teaches. Each edge crosses the values once, so the
  // total reads cannot exceed two per value however much the window grows and
  // shrinks in between.
  for (const std::vector<int>& values : {kReadings, repeated(1, 50), repeated(3, 8)}) {
    check("each value is read at most twice",
          byWindow(values, 6).reads <= 2 * static_cast<int>(values.size()));
  }

  const std::vector<int> forty = repeated(1, 40);
  check("trying every start costs far more",
        byEveryStart(forty, 6).reads > 5 * static_cast<int>(forty.size()));

  check("a budget below every value admits nothing", byWindow({4, 5, 6}, 3).width == 0);
  check("a budget above the total admits everything",
        byWindow(kReadings, 100).width == static_cast<int>(kReadings.size()));
  check("an empty sequence has no stretch", byWindow({}, 6).width == 0);
  check("zeros extend a stretch for free", byWindow({0, 0, 0}, 0).width == 3);

  // Not a warning left in prose. The window returns a smaller answer than the
  // truth, with nothing to indicate anything went wrong.
  const std::vector<int> negative = {5, -4, 1};
  check("the truth finds three", byExhaustive(negative, 2) == 3);
  check("the window finds only two", byWindow(negative, 2).width == 2);

  if (failures > 0) {
    return EXIT_FAILURE;
  }
  std::cout << "All checks passed.\n";
  return EXIT_SUCCESS;
}
