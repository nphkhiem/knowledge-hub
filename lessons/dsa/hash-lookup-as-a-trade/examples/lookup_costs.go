// Package examples holds runnable lesson implementations.
package examples

// HashSlot is a deliberately simple hash, so the slot for a key is easy to
// follow by hand.
func HashSlot(key string, slots int) int {
	total := 0
	for _, character := range key {
		total = (total*31 + int(character)) % slots
	}
	return total
}

// KeysExaminedByScan compares against each key in turn and returns how many it
// looked at. The cost grows with the collection.
func KeysExaminedByScan(keys []string, wanted string) int {
	examined := 0
	for _, key := range keys {
		examined++
		if key == wanted {
			return examined
		}
	}
	return examined
}

// KeysExaminedByHash reads only the keys sharing the wanted key's slot.
func KeysExaminedByHash(keys []string, wanted string, slots int) int {
	table := make(map[int][]string, slots)
	for _, key := range keys {
		slot := HashSlot(key, slots)
		table[slot] = append(table[slot], key)
	}

	examined := 0
	for _, key := range table[HashSlot(wanted, slots)] {
		examined++
		if key == wanted {
			return examined
		}
	}
	return examined
}
