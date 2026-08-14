#include <cstdlib>
#include <iostream>
#include <string>
#include <vector>

#include "lookup_costs.cpp"

namespace {
int failures = 0;
const std::vector<std::string> kKeys = {"cat", "dog", "emu", "fox",
                                        "owl", "bat", "ant", "cow"};

void check(const char* name, bool passed) {
  if (!passed) {
    std::cout << "FAIL " << name << "\n";
    ++failures;
  }
}
}  // namespace

int main() {
  check("scan reaches the wanted key", keysExaminedByScan(kKeys, "owl") == 5);
  check("scan examines all when absent",
        keysExaminedByScan(kKeys, "yak") == static_cast<int>(kKeys.size()));
  check("hash examines only its slot", keysExaminedByHash(kKeys, "owl", 16) < 3);
  check("absent key examines only its slot", keysExaminedByHash(kKeys, "yak", 16) < 3);

  std::vector<std::string> larger = kKeys;
  for (int index = 0; index < 200; ++index) {
    larger.push_back("key" + std::to_string(index));
  }
  check("hash stays cheap as the collection grows", keysExaminedByHash(larger, "owl", 512) < 3);
  check("scan does not", keysExaminedByScan(larger, "owl") > 3);

  check("a slot is stable", hashSlot("cat", 6) == hashSlot("cat", 6));
  for (const std::string& key : kKeys) {
    check("a slot is inside the table", hashSlot(key, 6) >= 0 && hashSlot(key, 6) < 6);
  }

  if (failures > 0) {
    return EXIT_FAILURE;
  }
  std::cout << "All checks passed.\n";
  return EXIT_SUCCESS;
}
