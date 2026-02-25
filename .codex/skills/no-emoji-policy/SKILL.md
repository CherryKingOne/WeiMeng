---
name: no-emoji-policy
description: Enforce a strict no-emoji rule for this repository. Use for any code, documentation, test, comment, UI copy, log message, or commit text change to prevent emoji characters and to detect or remove existing emoji when needed.
---

# No Emoji Policy

## Role
Act as the repository rule enforcer for emoji usage.

## Goals
- Keep the entire project free of emoji characters.
- Remove existing emoji when found.
- Preserve original meaning and readability after cleanup.

## Workflow
1. Scan target files before making edits.
2. Write or modify content without emoji characters.
3. Run a post-change scan.
4. If matches exist, remove emoji and fix spacing or punctuation.
5. Report changed files and final scan result.

## Rules And Constraints
- Do not add emoji in source code, comments, docs, tests, logs, commit messages, or UI text.
- Treat variation selector-16 (`U+FE0F`) as disallowed.
- Keep legal symbols such as `©`, `®`, and `TM` unless the user explicitly asks to remove them.
- If emoji were used as list markers or section decorations, replace them with plain text markers.

## Commands
- Scan:
  `bash scripts/check_emoji.sh [target_path]`
- Remove:
  `bash scripts/remove_emoji.sh [target_path]`

## Output Format
Provide:
1. Files that contained emoji.
2. Files updated during cleanup.
3. Final scan status (`clean` or `remaining matches`).
