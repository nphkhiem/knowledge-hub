// Two positions moving at different speeds through a sequence.
//
// The midpoint functions run on a vector because a vector is what a lesson
// figure can show. The cycle functions run on a chain of successor indices,
// which is a linked structure written as a vector: nexts[i] is where i points,
// and kEnd is the end. That is where the technique earns its place.
#include <optional>
#include <vector>

constexpr int kEnd = -1;

// Measure, then walk to the middle. Two passes over the values.
std::optional<int> middleByCounting(const std::vector<int>& values) {
  if (values.empty()) {
    return std::nullopt;
  }
  return static_cast<int>(values.size()) / 2;
}

// Advance one position per round and another two. One pass, no counting.
//
// With an even number of values there are two candidate middles. This returns
// the later of them, which is a convention the tests pin.
std::optional<int> middleByTwoSpeeds(const std::vector<int>& values) {
  if (values.empty()) {
    return std::nullopt;
  }

  int slow = 0;
  int fast = 0;
  const int size = static_cast<int>(values.size());
  // The linked-list form is "while fast and fast.next", which here means the
  // fast position can still take a first step.
  while (fast + 1 < size) {
    ++slow;
    fast += 2;
  }

  return slow;
}

// How many rounds the two-speed walk takes, for the one-pass claim.
int stepsTaken(const std::vector<int>& values) {
  int rounds = 0;
  int fast = 0;
  const int size = static_cast<int>(values.size());
  while (fast + 1 < size) {
    fast += 2;
    ++rounds;
  }
  return rounds;
}

// Whether following successors from `start` ever revisits a node. Two indices
// of memory, whatever the chain's length.
bool hasCycle(const std::vector<int>& nexts, int start) {
  if (nexts.empty()) {
    return false;
  }

  int slow = start;
  int fast = start;
  while (true) {
    if (fast == kEnd || nexts[static_cast<std::size_t>(fast)] == kEnd) {
      return false;
    }
    slow = nexts[static_cast<std::size_t>(slow)];
    fast = nexts[static_cast<std::size_t>(nexts[static_cast<std::size_t>(fast)])];
    if (slow == fast) {
      return true;
    }
  }
}

// Where the loop begins, or nothing when there is no loop. The meeting point is
// not the entrance, so this runs a second phase to find it.
std::optional<int> cycleEntrance(const std::vector<int>& nexts, int start) {
  if (!hasCycle(nexts, start)) {
    return std::nullopt;
  }

  int slow = start;
  int fast = start;
  do {
    slow = nexts[static_cast<std::size_t>(slow)];
    fast = nexts[static_cast<std::size_t>(nexts[static_cast<std::size_t>(fast)])];
  } while (slow != fast);

  int entrance = start;
  while (entrance != slow) {
    entrance = nexts[static_cast<std::size_t>(entrance)];
    slow = nexts[static_cast<std::size_t>(slow)];
  }

  return entrance;
}
