// Last-in, first-out order, and one thing it is genuinely needed for.
//
// `drain` exists to state the defining property: what comes out is what went
// in, reversed. `isBalanced` exists because that property does real work there,
// and a counter of opens and closes cannot do the same job.
#include <algorithm>
#include <string>
#include <vector>

namespace {
const std::string kOpeners = "([{";

char openerFor(char closer) {
  switch (closer) {
    case ')':
      return '(';
    case ']':
      return '[';
    case '}':
      return '{';
    default:
      return '\0';
  }
}
}  // namespace

// Push everything, then pop everything. The order reverses.
std::vector<std::string> drain(const std::vector<std::string>& items) {
  std::vector<std::string> pile;
  for (const std::string& item : items) {
    pile.push_back(item);
  }

  std::vector<std::string> out;
  while (!pile.empty()) {
    out.push_back(pile.back());
    pile.pop_back();
  }
  return out;
}

// Whether every bracket closes the one most recently left open.
bool isBalanced(const std::string& text) {
  std::vector<char> pile;

  for (char character : text) {
    if (kOpeners.find(character) != std::string::npos) {
      pile.push_back(character);
      continue;
    }
    const char opener = openerFor(character);
    if (opener == '\0') {
      continue;
    }
    // Two distinct failures: nothing is open, or the wrong thing is.
    if (pile.empty() || pile.back() != opener) {
      return false;
    }
    pile.pop_back();
  }

  // Anything still open never closed.
  return pile.empty();
}

// How deep the pile ever got, which is the space this really costs.
int deepestNesting(const std::string& text) {
  int depth = 0;
  int deepest = 0;

  for (char character : text) {
    if (kOpeners.find(character) != std::string::npos) {
      ++depth;
      deepest = std::max(deepest, depth);
    } else if (openerFor(character) != '\0' && depth > 0) {
      --depth;
    }
  }

  return deepest;
}
