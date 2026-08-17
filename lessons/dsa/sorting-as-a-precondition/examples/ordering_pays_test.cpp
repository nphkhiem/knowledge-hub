#include <cstdlib>
#include <iostream>
#include <numeric>
#include <vector>

#include "ordering_pays.cpp"

namespace {
int failures = 0;
const std::vector<int> kArrived = {38, 5, 91, 23, 8};
const std::vector<int> kOrdered = {5, 8, 23, 38, 91};

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

int worstHalving(const std::vector<int>& values) {
  int worst = 0;
  for (int value : values) {
    worst = std::max(worst, byHalving(values, value).comparisons);
  }
  return worst;
}

std::vector<int> valuesOf(const std::vector<Placed>& placed) {
  std::vector<int> out;
  for (const Placed& entry : placed) out.push_back(entry.value);
  return out;
}

std::vector<int> originsOf(const std::vector<Placed>& placed) {
  std::vector<int> out;
  for (const Placed& entry : placed) out.push_back(entry.origin);
  return out;
}
}  // namespace

int main() {
  const Probe lesson = byScan(kArrived, 8);
  check("the lesson scan", lesson.index == 4 && lesson.comparisons == 5);
  check("the lesson halving", byHalving(kOrdered, 8).index == 1);

  // The reason this is a precondition rather than a step. Given the same values
  // in arrival order, the halving search reports the value absent. It does not
  // fail or complain; it returns a confident wrong answer.
  check("halving on unordered values silently lies",
        !byHalving(kArrived, 8).index.has_value());
  check("a scan still finds it", byScan(kArrived, 8).index == 4);

  for (int absent : {0, 100}) {
    check("scanning examines every value",
          byScan(kArrived, absent).comparisons == static_cast<int>(kArrived.size()));
  }

  // Eight times the values, three more comparisons, not eight times as many.
  const std::vector<int> small = range(128);
  const std::vector<int> large = range(1024);
  check("growth is three more comparisons",
        worstHalving(large) - worstHalving(small) == 3);
  check("scanning to the far end reads every value",
        byScan(large, 1023).comparisons == 1024);
  check("halving never exceeds the halvings that reach one", worstHalving(large) == 11);

  // A scan reads at most every value once. Any sort must read every value at
  // least once, so for a single question the scan cannot lose.
  const std::vector<int> single = range(512);
  check("one question does not repay the ordering",
        byScan(single, 511).comparisons <= static_cast<int>(single.size()));

  const std::vector<Placed> placed = sortedWithOrigin(kArrived);
  check("ordering keeps the values", valuesOf(placed) == kOrdered);
  check("carrying the position is the only way back",
        originsOf(placed) == std::vector<int>({1, 4, 3, 0, 2}));

  // Stability, stated as a test. The two 7s must come back in the order they
  // arrived, which is what lets two sorts be combined.
  std::vector<int> sevens;
  for (const Placed& entry : sortedWithOrigin({7, 3, 7, 1})) {
    if (entry.value == 7) sevens.push_back(entry.origin);
  }
  check("equal values keep their arrival order", sevens == std::vector<int>({0, 2}));

  check("an empty collection orders to nothing", sortedWithOrigin({}).empty());
  check("halving an empty collection", !byHalving({}, 1).index.has_value());
  check("a single value", byHalving({9}, 9).index == 0);

  if (failures > 0) {
    return EXIT_FAILURE;
  }
  std::cout << "All checks passed.\n";
  return EXIT_SUCCESS;
}
