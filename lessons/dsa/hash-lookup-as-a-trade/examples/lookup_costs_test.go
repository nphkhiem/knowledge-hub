package examples

import (
	"fmt"
	"testing"
)

var keys = []string{"cat", "dog", "emu", "fox", "owl", "bat", "ant", "cow"}

func TestScanReachesTheWantedKey(t *testing.T) {
	if got := KeysExaminedByScan(keys, "owl"); got != 5 {
		t.Fatalf("expected 5 keys examined, got %d", got)
	}
}

func TestScanExaminesAllWhenAbsent(t *testing.T) {
	if got := KeysExaminedByScan(keys, "yak"); got != len(keys) {
		t.Fatalf("expected %d keys examined, got %d", len(keys), got)
	}
}

func TestHashExaminesOnlyItsSlot(t *testing.T) {
	if got := KeysExaminedByHash(keys, "owl", 16); got >= 3 {
		t.Fatalf("expected fewer than 3 keys examined, got %d", got)
	}
}

func TestHashStaysCheapAsTheCollectionGrows(t *testing.T) {
	larger := append([]string{}, keys...)
	for index := 0; index < 200; index++ {
		larger = append(larger, fmt.Sprintf("key%d", index))
	}

	if got := KeysExaminedByHash(larger, "owl", 512); got >= 3 {
		t.Fatalf("expected hashing to stay cheap, got %d", got)
	}
	if got := KeysExaminedByScan(larger, "owl"); got <= 3 {
		t.Fatalf("expected scanning to grow, got %d", got)
	}
}

func TestASlotIsStableAndInsideTheTable(t *testing.T) {
	if HashSlot("cat", 6) != HashSlot("cat", 6) {
		t.Fatal("expected a key to hash to the same slot twice")
	}
	for _, key := range keys {
		if slot := HashSlot(key, 6); slot < 0 || slot >= 6 {
			t.Fatalf("slot %d for %q is outside the table", slot, key)
		}
	}
}

func TestAnAbsentKeyExaminesOnlyItsSlot(t *testing.T) {
	if got := KeysExaminedByHash(keys, "yak", 16); got >= 3 {
		t.Fatalf("expected fewer than 3 keys examined, got %d", got)
	}
}
