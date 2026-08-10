#!/usr/bin/env bash
#
# Executes every lesson's example implementation against its own real test,
# one mechanism per language, because an untested sample must not ship (see
# the EXAMPLE_LANGUAGES comment in packages/lesson-schema/src/v1.ts). This is
# a script rather than another package.json one-liner because it now covers
# five genuinely different toolchains; keeping that logic readable mattered
# more than staying inline.
set -euo pipefail

status=0

for dir in lessons/*/*/examples; do
  [ -d "$dir" ] || continue

  if compgen -G "$dir"/test_*.py > /dev/null; then
    echo "== Python: $dir =="
    python3 -m unittest discover -s "$dir" -t "$dir" -p 'test_*.py' || status=1
  fi

  if compgen -G "$dir"/*Test.java > /dev/null; then
    echo "== Java: $dir =="
    (
      cd "$dir"
      javac ./*.java
      java_status=0
      for test_class in *Test.java; do
        java "${test_class%.java}" || java_status=1
      done
      rm -f ./*.class
      exit "$java_status"
    ) || status=1
  fi

  if compgen -G "$dir"/*_test.cpp > /dev/null; then
    echo "== C++: $dir =="
    for test_file in "$dir"/*_test.cpp; do
      binary="$(mktemp)"
      g++ -std=c++17 -Wall -Wextra -o "$binary" "$test_file"
      "$binary" || status=1
      rm -f "$binary"
    done
  fi
done

# Go tests its whole module in one pass rather than per directory, and
# CGO_ENABLED=0 keeps its build from erroring out on the C++ examples that
# share the same lessons/*/*/examples directories.
if compgen -G "lessons/*/*/examples/*_test.go" > /dev/null; then
  echo "== Go: lessons/... =="
  (cd lessons && CGO_ENABLED=0 go test ./...) || status=1
fi

exit $status
