#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-}"

if [[ -z "$TARGET" ]]; then
  echo "Usage: $0 <skill_path>"
  exit 2
fi

if [[ ! -d "$TARGET" ]]; then
  echo "ERROR: skill path not found: $TARGET"
  exit 1
fi

SKILL_FILE="$TARGET/SKILL.md"
if [[ ! -f "$SKILL_FILE" ]]; then
  echo "ERROR: missing required file: $SKILL_FILE"
  exit 1
fi

if ! head -n 1 "$SKILL_FILE" | grep -q '^---$'; then
  echo "ERROR: SKILL.md must start with YAML front matter (---)"
  exit 1
fi

if ! awk 'NR>1 && /^---$/ {exit} NR<=200 {print}' "$SKILL_FILE" | grep -q '^name:'; then
  echo "ERROR: front matter missing name"
  exit 1
fi

if ! awk 'NR>1 && /^---$/ {exit} NR<=200 {print}' "$SKILL_FILE" | grep -q '^description:'; then
  echo "ERROR: front matter missing description"
  exit 1
fi

SKILL_DIR_NAME="$(basename "$TARGET")"
if [[ ! "$SKILL_DIR_NAME" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "WARNING: skill directory is not kebab-case: $SKILL_DIR_NAME"
fi

echo "OK: basic skill structure is valid"
