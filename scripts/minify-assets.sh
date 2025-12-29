#!/bin/bash
set -e

# Minify JS files (only if changed)
find public -name '*.js' -not -name '*.min.js' -type f | while read -r f; do
  m="${f%.js}.min.js"
  if [ ! -f "$m" ] || [ "$f" -nt "$m" ]; then
    echo "Minifying $f"
    terser "$f" -o "$m"
  fi
done

# Minify CSS files (only if changed)
find public -name '*.css' -not -name '*.min.css' -type f | while read -r f; do
  m="${f%.css}.min.css"
  if [ ! -f "$m" ] || [ "$f" -nt "$m" ]; then
    echo "Minifying $f"
    cleancss -o "$m" "$f"
  fi
done
