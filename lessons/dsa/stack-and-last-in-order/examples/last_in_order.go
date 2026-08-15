// Package examples holds runnable lesson implementations.
package examples

import "strings"

const openers = "([{"

func openerFor(closer rune) rune {
	switch closer {
	case ')':
		return '('
	case ']':
		return '['
	case '}':
		return '{'
	default:
		return 0
	}
}

// Drain pushes everything and then pops everything, so the order reverses.
// This is the defining property of the structure rather than a side effect.
func Drain(items []string) []string {
	pile := make([]string, 0, len(items))
	pile = append(pile, items...)

	out := make([]string, 0, len(items))
	for len(pile) > 0 {
		out = append(out, pile[len(pile)-1])
		pile = pile[:len(pile)-1]
	}
	return out
}

// IsBalanced reports whether every bracket closes the one most recently left
// open.
func IsBalanced(text string) bool {
	pile := make([]rune, 0, len(text))

	for _, character := range text {
		if strings.ContainsRune(openers, character) {
			pile = append(pile, character)
			continue
		}
		opener := openerFor(character)
		if opener == 0 {
			continue
		}
		// Two distinct failures: nothing is open, or the wrong thing is.
		if len(pile) == 0 || pile[len(pile)-1] != opener {
			return false
		}
		pile = pile[:len(pile)-1]
	}

	// Anything still open never closed.
	return len(pile) == 0
}

// DeepestNesting reports how deep the pile ever got, which is the space this
// really costs.
func DeepestNesting(text string) int {
	depth := 0
	deepest := 0

	for _, character := range text {
		switch {
		case strings.ContainsRune(openers, character):
			depth++
			if depth > deepest {
				deepest = depth
			}
		case openerFor(character) != 0 && depth > 0:
			depth--
		}
	}

	return deepest
}
