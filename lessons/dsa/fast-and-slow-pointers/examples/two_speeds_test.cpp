#include <cstdlib>
#include <iostream>
#include <numeric>
#include <vector>

#include "two_speeds.cpp"

namespace {
int failures = 0;
const std::vector<int> kReadings = {4, 8, 15, 16, 23, 42, 9};

void check(const char* name, bool passed) {
  if (!passed) {
    std::cout << "FAIL " << name << "\n";
    ++failures;
  }
}

std::vector<int> range(int length) {
  std::vector<int> values(static_cast<std::size_t>(length));
  std::iota(values.begin(), values.end(), 0);
  return values;
}

// A straight chain of `length` nodes, ending rather than looping.
std::vector<int> chain(int length) {
  std::vector<int> nexts;
  for (int at = 0; at < length; ++at) {
    nexts.push_back(at == length - 1 ? kEnd : at + 1);
  }
  return nexts;
}

// A chain whose last node points back to `entrance`.
std::vector<int> looped(int length, int entrance) {
  std::vector<int> nexts;
  for (int at = 0; at < length; ++at) {
    nexts.push_back(at == length - 1 ? entrance : at + 1);
  }
  return nexts;
}
}  // namespace

int main() {
  check("the lesson readings",
        middleByTwoSpeeds(kReadings) == 3 && kReadings[3] == 16);

  for (int length = 1; length < 60; ++length) {
    const std::vector<int> values = range(length);
    check("both ways agree", middleByTwoSpeeds(values) == middleByCounting(values));
    // The fast position takes two steps per round and stops at the end, so the
    // rounds cannot exceed half the length. Nothing walks twice.
    check("one pass", stepsTaken(values) <= (length + 1) / 2);
  }

  // A convention rather than a discovery, pinned so a caller can rely on it.
  check("an even length returns the later middle", middleByTwoSpeeds({0, 1, 2, 3}) == 2);
  check("an empty sequence has no middle", !middleByTwoSpeeds({}).has_value());
  check("a single value is its own middle", middleByTwoSpeeds({9}) == 0);

  for (int length = 1; length < 30; ++length) {
    check("a straight chain has no cycle", !hasCycle(chain(length), 0));
  }

  // The meeting point is generally not the entrance. This checks the second
  // phase against chains whose entrance is known by construction.
  for (int length = 2; length < 30; ++length) {
    for (int entrance = 0; entrance < length - 1; ++entrance) {
      const std::vector<int> nexts = looped(length, entrance);
      check("a looping chain has one", hasCycle(nexts, 0));
      check("the entrance is found", cycleEntrance(nexts, 0) == entrance);
    }
  }

  check("no entrance without a cycle", !cycleEntrance(chain(10), 0).has_value());
  check("a node pointing at itself is a cycle",
        hasCycle({0}, 0) && cycleEntrance({0}, 0) == 0);

  if (failures > 0) {
    return EXIT_FAILURE;
  }
  std::cout << "All checks passed.\n";
  return EXIT_SUCCESS;
}
