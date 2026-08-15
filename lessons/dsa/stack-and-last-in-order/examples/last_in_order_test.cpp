#include <cstdlib>
#include <iostream>
#include <string>
#include <vector>

#include "last_in_order.cpp"

namespace {
int failures = 0;
const std::vector<std::string> kWork = {"render page", "lay out list",
                                        "measure row"};

void check(const char* name, bool passed) {
  if (!passed) {
    std::cout << "FAIL " << name << "\n";
    ++failures;
  }
}

std::vector<std::string> reversed(const std::vector<std::string>& items) {
  return std::vector<std::string>(items.rbegin(), items.rend());
}

std::string repeat(const std::string& unit, int times) {
  std::string out;
  for (int at = 0; at < times; ++at) {
    out += unit;
  }
  return out;
}
}  // namespace

int main() {
  // The defining property, over many inputs rather than one. A structure that
  // failed this would not be a stack whatever its methods were named.
  const std::vector<std::vector<std::string>> inputs = {
      {},
      {"only"},
      kWork,
      {"a", "b", "c", "d", "e", "f"},
      {"same", "same", "same"}};
  for (const std::vector<std::string>& items : inputs) {
    check("drain reverses", drain(items) == reversed(items));
  }

  check("the lesson order",
        drain(kWork) ==
            std::vector<std::string>({"measure row", "lay out list", "render page"}));
  check("draining twice restores the original order", drain(drain(kWork)) == kWork);

  for (const std::string& text : {"", "()", "([{}])", "a(b)c[d]e", "(())()"}) {
    check("balanced accepts", isBalanced(text));
  }

  check("a closer with nothing open", !isBalanced(")"));
  check("a closer past the end", !isBalanced("())"));
  check("something left open", !isBalanced("("));
  check("partly closed", !isBalanced("([)"));

  // The case a counter of opens and closes cannot detect: the counts match and
  // the nesting is still wrong.
  check("the wrong closer", !isBalanced("([)]"));

  // A thousand pairs in sequence never need more than one slot; ten nested need
  // ten. This is why recursion depth is the thing to reason about.
  check("depth of a flat sequence", deepestNesting(repeat("()", 1000)) == 1);
  check("depth of nesting", deepestNesting(repeat("(", 10) + repeat(")", 10)) == 10);

  check("text without brackets is balanced", isBalanced("no brackets here"));
  check("text without brackets is flat", deepestNesting("no brackets here") == 0);

  if (failures > 0) {
    return EXIT_FAILURE;
  }
  std::cout << "All checks passed.\n";
  return EXIT_SUCCESS;
}
