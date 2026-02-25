#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-.}"
PATTERN='(?![©®™])[\p{Extended_Pictographic}]|\x{FE0F}'

rg -nP --hidden \
  --glob '!.git' \
  --glob '!**/node_modules/**' \
  --glob '!**/.next/**' \
  "$PATTERN" "$TARGET"
