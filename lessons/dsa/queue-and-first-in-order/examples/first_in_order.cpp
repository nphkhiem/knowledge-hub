// First-in, first-out order, against the last-in order of a pile.
//
// Both functions read the same events and differ only in which end they serve.
// That single difference is the whole lesson, so they are deliberately
// identical except for one line each.
//
// An event is either an arrival, written "+name", or a service, written "-".
//
// The line is a plain vector, so serving the front shifts everything down and
// costs the length rather than a constant. That is the wrong implementation for
// real use and the clearest one for showing an order. See the deep dive.
#include <string>
#include <vector>

namespace {
bool isArrival(const std::string& event) {
  return !event.empty() && event.front() == '+';
}
}  // namespace

// Serve the end that has waited longest. This is a queue.
std::vector<std::string> serveFirstIn(const std::vector<std::string>& events) {
  std::vector<std::string> waiting;
  std::vector<std::string> served;

  for (const std::string& event : events) {
    if (isArrival(event)) {
      waiting.push_back(event.substr(1));
    } else if (!waiting.empty()) {
      served.push_back(waiting.front());
      waiting.erase(waiting.begin());
    }
  }

  return served;
}

// Serve the most recent arrival. This is a stack, shown for contrast.
std::vector<std::string> serveLastIn(const std::vector<std::string>& events) {
  std::vector<std::string> waiting;
  std::vector<std::string> served;

  for (const std::string& event : events) {
    if (isArrival(event)) {
      waiting.push_back(event.substr(1));
    } else if (!waiting.empty()) {
      served.push_back(waiting.back());
      waiting.pop_back();
    }
  }

  return served;
}

// The names that arrived, in the order they did.
std::vector<std::string> arrivalsIn(const std::vector<std::string>& events) {
  std::vector<std::string> arrivals;
  for (const std::string& event : events) {
    if (isArrival(event)) {
      arrivals.push_back(event.substr(1));
    }
  }
  return arrivals;
}

// One early arrival, then arrivals and services alternating forever.
std::vector<std::string> steadyStream(const std::string& first, int rounds) {
  std::vector<std::string> events = {"+" + first};
  for (int round = 0; round < rounds; ++round) {
    events.push_back("+later-" + std::to_string(round));
    events.push_back("-");
  }
  return events;
}
