#include <algorithm>
#include <cstdlib>
#include <iostream>
#include <string>
#include <vector>

#include "first_in_order.cpp"

namespace {
int failures = 0;
const std::vector<std::string> kLesson = {"+report.pdf", "+photo.jpg", "-",
                                          "+notes.txt", "-", "-"};

void check(const char* name, bool passed) {
  if (!passed) {
    std::cout << "FAIL " << name << "\n";
    ++failures;
  }
}

bool holds(const std::vector<std::string>& items, const std::string& name) {
  return std::find(items.begin(), items.end(), name) != items.end();
}

long positionOf(const std::vector<std::string>& items, const std::string& name) {
  return std::find(items.begin(), items.end(), name) - items.begin();
}
}  // namespace

int main() {
  // The defining property, over several event sequences rather than one.
  const std::vector<std::vector<std::string>> sequences = {
      {"+a", "-"},
      kLesson,
      {"+a", "+b", "+c", "-", "-", "-"},
      {"+a", "-", "+b", "-", "+c", "-"}};
  for (const std::vector<std::string>& events : sequences) {
    check("served in arrival order", serveFirstIn(events) == arrivalsIn(events));
  }

  check("the lesson order",
        serveFirstIn(kLesson) ==
            std::vector<std::string>({"report.pdf", "photo.jpg", "notes.txt"}));

  // The contrast the two lessons exist to draw, on identical input.
  check("a pile serves a different order",
        serveLastIn(kLesson) ==
            std::vector<std::string>({"photo.jpg", "notes.txt", "report.pdf"}));

  // notes.txt arrives after photo.jpg is already waiting and is served after
  // it. This is the step where the pile does the opposite.
  const std::vector<std::string> served = serveFirstIn(kLesson);
  const std::vector<std::string> piled = serveLastIn(kLesson);
  check("a late arrival does not overtake",
        positionOf(served, "photo.jpg") < positionOf(served, "notes.txt"));
  check("the pile serves the newer first",
        positionOf(piled, "notes.txt") < positionOf(piled, "report.pdf"));

  // Not "may be delayed": under alternating arrivals and services a pile never
  // serves the first item at all, for any number of rounds.
  for (int rounds : {1, 5, 50}) {
    const std::vector<std::string> events = steadyStream("first", rounds);
    check("a queue serves the first arrival", holds(serveFirstIn(events), "first"));
    check("a pile starves it", !holds(serveLastIn(events), "first"));
  }

  check("the queue serves it immediately",
        serveFirstIn(steadyStream("first", 5)).front() == "first");

  check("serving an empty line does nothing", serveFirstIn({"-", "-"}).empty());
  check("serving after an empty line still works",
        serveFirstIn({"-", "+a", "-"}) == std::vector<std::string>({"a"}));
  check("unserved arrivals are not served",
        serveFirstIn({"+a", "+b", "-"}) == std::vector<std::string>({"a"}));
  check("no events serve nobody",
        serveFirstIn({}).empty() && serveLastIn({}).empty());
  check("repeated names are ordinary",
        serveFirstIn({"+job", "+job", "-", "-"}) ==
            std::vector<std::string>({"job", "job"}));

  if (failures > 0) {
    return EXIT_FAILURE;
  }
  std::cout << "All checks passed.\n";
  return EXIT_SUCCESS;
}
