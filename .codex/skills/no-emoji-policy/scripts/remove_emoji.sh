#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-.}"
PATTERN='(?![©®™])[\p{Extended_Pictographic}]|\x{FE0F}'

while IFS= read -r -d '' file; do
  perl -CSDA -Mutf8 -i -pe 's/(?![©®™])\p{Extended_Pictographic}//g; s/\x{FE0F}//g' "$file"
done < <(
  rg -0 -lP --hidden \
    --glob '!.git' \
    --glob '!**/node_modules/**' \
    --glob '!**/.next/**' \
    "$PATTERN" "$TARGET" || true
)
