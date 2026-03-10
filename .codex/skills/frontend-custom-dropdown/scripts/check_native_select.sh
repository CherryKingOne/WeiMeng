#!/usr/bin/env bash
set -euo pipefail

target_path="${1:-.}"

if ! command -v rg >/dev/null 2>&1; then
  echo "Error: rg is required but not found in PATH." >&2
  exit 2
fi

matches="$(
  rg -n \
    --glob '!**/node_modules/**' \
    --glob '!**/.next/**' \
    --glob '!**/dist/**' \
    --glob '*.{html,htm,js,jsx,ts,tsx,vue}' \
    '<select([[:space:]>])' \
    "$target_path" || true
)"

if [[ -n "$matches" ]]; then
  echo "Native <select> detected:"
  echo "$matches"
  exit 1
fi

echo "No native <select> detected in: $target_path"
