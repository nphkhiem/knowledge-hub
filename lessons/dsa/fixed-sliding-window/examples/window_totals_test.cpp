#include <cstdlib>
#include <iostream>
#include <vector>

#include "window_totals.cpp"

namespace {
int failures = 0;
const std::vector<int> kValues = {5, 1, 8, 2, 3, 7};
const int kWidth = 3;

void check(const char* name, bool passed) {
  if (!passed) {
    std::cout << "FAIL " << name << "\n";
    ++failures;
  }
}
}  // namespace

int main() {
  const int size = static_cast<int>(kValues.size());

  for (int width = 1; width <= size; ++width) {
    check("approaches agree", bySliding(kValues, width).totals == byRescan(kValues, width).totals);
  }

  check("the lesson windows",
        bySliding(kValues, kWidth).totals == std::vector<int>({14, 11, 13, 12}));
  check("the largest window is the first", bestWindowTotal(kValues, kWidth) == 14);

  // The property the lesson teaches: a move removes one value and adds one,
  // whatever the width.
  for (int width = 1; width <= size; ++width) {
    const WindowScan scan = bySliding(kValues, width);
    const int moves = static_cast<int>(scan.totals.size()) - 1;
    check("every move costs two", scan.operations - width == 2 * moves);
  }

  for (int width = 3; width < size; ++width) {
    check("sliding does less arithmetic",
          bySliding(kValues, width).operations < byRescan(kValues, width).operations);
  }

  // A window as wide as the sequence never moves, so there is nothing to
  // repair and both approaches do identical work.
  check("one window saves nothing",
        bySliding(kValues, size).operations == byRescan(kValues, size).operations);

  // Honest edge: with nothing overlapping, the repair costs more than the
  // rebuild it replaces.
  check("repairing is not worth it at width one",
        bySliding(kValues, 1).operations > byRescan(kValues, 1).operations);

  check("a window as wide as the sequence has one position",
        bySliding(kValues, size).totals == std::vector<int>({26}));
  check("a window wider than the sequence has none", bySliding(kValues, size + 1).totals.empty());
  check("no best window when none fits", !bestWindowTotal(kValues, size + 1).has_value());
  check("an empty sequence has no windows", bySliding({}, 3).totals.empty());
  check("a width of zero has no windows", windowCount(size, 0) == 0);
  check("a negative width has no windows", byRescan(kValues, -1).totals.empty());
  check("negative values repair correctly",
        bySliding({4, -2, 6, -1}, 2).totals == byRescan({4, -2, 6, -1}, 2).totals);

  if (failures > 0) {
    return EXIT_FAILURE;
  }
  std::cout << "All checks passed.\n";
  return EXIT_SUCCESS;
}
