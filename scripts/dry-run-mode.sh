#!/bin/bash
find ./app -depth | while read path; do
  base=$(basename "$path")
  dir=$(dirname "$path")

  # Convert CamelCase to kebab-case
  newbase=$(echo "$base" \
    | sed -E 's/([a-z0-9])([A-Z])/\1-\2/g' \
    | sed -E 's/ /-/g' \
    | tr '[:upper:]' '[:lower:]')

  if [ "$base" != "$newbase" ]; then
    echo "$path -> $dir/$newbase"
    # Uncomment below when you’re ready to actually rename
    # mv "$path" "$dir/$newbase"
  fi
done
