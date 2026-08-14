// Count the slots two membership checks examine on the same keys.
//
// The lesson's claim is that hashing removes a scan. Both functions return how
// many stored keys they had to look at, so the difference is observable.
#include <string>
#include <unordered_map>
#include <vector>

// A deliberately simple hash, so the slot for a key is easy to follow.
int hashSlot(const std::string& key, int slots) {
  int total = 0;
  for (char character : key) {
    total = (total * 31 + static_cast<int>(character)) % slots;
  }
  return total;
}

// Compare against each key in turn. Cost grows with the collection.
int keysExaminedByScan(const std::vector<std::string>& keys, const std::string& wanted) {
  int examined = 0;
  for (const std::string& key : keys) {
    ++examined;
    if (key == wanted) {
      return examined;
    }
  }
  return examined;
}

// Read only the keys that share the wanted key's slot.
int keysExaminedByHash(const std::vector<std::string>& keys, const std::string& wanted,
                       int slots) {
  std::unordered_map<int, std::vector<std::string>> table;
  for (const std::string& key : keys) {
    table[hashSlot(key, slots)].push_back(key);
  }

  int examined = 0;
  for (const std::string& key : table[hashSlot(wanted, slots)]) {
    ++examined;
    if (key == wanted) {
      return examined;
    }
  }
  return examined;
}
