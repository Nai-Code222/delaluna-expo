#!/bin/bash
# update-imports.sh
# Fix all import paths in .ts/.tsx files to match kebab-case file names

set -e

# Convert a string to kebab-case
to_kebab() {
  echo "$1" | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' | tr '[:upper:]' '[:lower:]'
}

# Scan all TS/TSX files
find ./app ./archive ./src -type f \( -name "*.ts" -o -name "*.tsx" \) | while read file; do
  echo "🔍 Updating imports in: $file"

  # Match relative imports like ./SomeFile or ../OtherDir/ThatFile
  grep -E "from ['\"](\.\/|\.\.\/).*['\"]" "$file" | while read -r line; do
    # Extract path part only
    path=$(echo "$line" | sed -E "s/.*from ['\"]([^'\"]+)['\"].*/\1/")

    # Skip if it's a directory or already kebab-case
    base=$(basename "$path")
    dir=$(dirname "$path")
    kebab=$(to_kebab "$base")

    if [ "$base" != "$kebab" ]; then
      newpath="$dir/$kebab"
      echo "   👉 $path -> $newpath"
      # Replace in file
      sed -i.bak "s|from ['\"]$path['\"]|from '$newpath'|g" "$file"
      rm -f "$file.bak"
    fi
  done
done
