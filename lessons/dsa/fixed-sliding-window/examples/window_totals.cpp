// Totals of every fixed-width window, rebuilt and repaired.
//
// Both functions answer the same question and return the same totals. They
// differ only in how much arithmetic they do to get there, which is the point
// of the lesson, so each also reports the additions and subtractions it
// performed.
#include <algorithm>
#include <optional>
#include <vector>

// The total of each window, and the arithmetic it cost to produce them.
struct WindowScan {
  std::vector<int> totals;
  int operations;
};

// Windows of `width` that fit in `length` values, never fewer than zero.
//
// A width larger than the sequence yields no windows at all rather than one
// short window, because a partial window answers a different question.
int windowCount(int length, int width) {
  if (width <= 0) {
    return 0;
  }
  return std::max(0, length - width + 1);
}

// Add every window from scratch. Costs one addition per value per window.
WindowScan byRescan(const std::vector<int>& values, int width) {
  WindowScan scan{{}, 0};
  const int count = windowCount(static_cast<int>(values.size()), width);

  for (int start = 0; start < count; ++start) {
    int total = 0;
    for (int index = start; index < start + width; ++index) {
      total += values[static_cast<std::size_t>(index)];
      ++scan.operations;
    }
    scan.totals.push_back(total);
  }

  return scan;
}

// Build the first window, then repair it. Each move costs exactly two.
WindowScan bySliding(const std::vector<int>& values, int width) {
  const int count = windowCount(static_cast<int>(values.size()), width);
  if (count == 0) {
    return WindowScan{{}, 0};
  }

  int total = 0;
  int operations = 0;
  for (int index = 0; index < width; ++index) {
    total += values[static_cast<std::size_t>(index)];
    ++operations;
  }

  std::vector<int> totals = {total};
  for (int start = 1; start < count; ++start) {
    total -= values[static_cast<std::size_t>(start - 1)];
    total += values[static_cast<std::size_t>(start + width - 1)];
    operations += 2;
    totals.push_back(total);
  }

  return WindowScan{totals, operations};
}

// The largest window total, or empty when no window fits.
std::optional<int> bestWindowTotal(const std::vector<int>& values, int width) {
  const std::vector<int> totals = bySliding(values, width).totals;
  if (totals.empty()) {
    return std::nullopt;
  }
  return *std::max_element(totals.begin(), totals.end());
}
