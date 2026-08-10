#include <optional>
#include <utility>
#include <vector>

/**
 * Two pointers moving inward across an ascending-sorted sequence.
 *
 * Returns the indices of the two values that add to `target`, or
 * std::nullopt when no pair sums to the target. `values` must be sorted in
 * ascending order. Runs in O(n) time and O(1) additional space.
 */
std::optional<std::pair<int, int>> find_pair_with_sum(
    const std::vector<int>& values, int target) {
  int left = 0;
  int right = static_cast<int>(values.size()) - 1;

  while (left < right) {
    int total = values[left] + values[right];
    if (total == target) {
      return std::make_pair(left, right);
    }

    // The larger value cannot pair with anything still in range, so drop it.
    if (total > target) {
      right -= 1;
    } else {
      left += 1;
    }
  }

  return std::nullopt;
}
