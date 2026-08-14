// Searching a sorted vector by halving, and by scanning it.
//
// Both functions answer the same question. They differ in how many values they
// look at to answer it, which is the point of the lesson, so each reports the
// number of values it examined.
#include <optional>
#include <vector>

// Where the value was found, and how many values were examined.
struct Search {
  std::optional<int> index;
  int probes;
};

// Walk from one end, ignoring the order the values are already in.
Search byScan(const std::vector<int>& values, int target) {
  for (int index = 0; index < static_cast<int>(values.size()); ++index) {
    if (values[static_cast<std::size_t>(index)] == target) {
      return Search{index, index + 1};
    }
  }
  return Search{std::nullopt, static_cast<int>(values.size())};
}

// Keep the range that could still hold the target, and halve it.
Search byHalving(const std::vector<int>& values, int target) {
  int low = 0;
  int high = static_cast<int>(values.size()) - 1;
  int probes = 0;

  while (low <= high) {
    // low + (high - low) / 2, not (low + high) / 2. The sum overflows a
    // fixed-width int once the indices are large enough; the offset cannot.
    const int middle = low + (high - low) / 2;
    const int value = values[static_cast<std::size_t>(middle)];
    ++probes;

    if (value == target) {
      return Search{middle, probes};
    }
    if (value < target) {
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  return Search{std::nullopt, probes};
}
