---
name: frontend-custom-dropdown
description: Enforce custom dropdowns for frontend page and component design. Use this skill whenever the user asks for page UI, form UI, model pickers, select/dropdown interactions, or mentions style mismatch in a select menu. Do not use native `<select>` in design implementations; always replace it with a custom dropdown (button + custom panel + JS interaction) so the expanded menu is fully controlled by page styles. Trigger on terms such as "下拉", "选择器", "文本模型", "select 样式", "弹窗不一致", "dropdown", and "model selector".
---

# Frontend Custom Dropdown

## Role
Act as a frontend implementation guardrail for dropdown controls.

## Non-Negotiable Rule
- In UI design implementation, do not use native `<select>` for visible dropdowns.
- Always implement a custom dropdown with:
  - Trigger button
  - Custom options panel
  - JavaScript interactions
- Ensure expanded-layer style is fully theme-controlled by page CSS.

## Why This Rule Exists
Native `<select>` can only be partially styled. The expanded options panel is browser/OS rendered and often breaks visual consistency with the page theme.

## Required Implementation Pattern
1. Use a semantic trigger:
   - `button[type="button"]`
   - `aria-haspopup="listbox"`
   - `aria-expanded="true|false"`
2. Render options in a custom panel:
   - Absolute-positioned container
   - `role="listbox"`
   - Option items with a consistent selected and hover style
3. Synchronize selected value:
   - Update trigger text on selection
   - Keep a hidden input for form submission if needed
4. Implement core interactions:
   - Click trigger to open and close
   - Click option to select and close
   - Click outside to close
   - `Escape` to close
5. Keep design consistent with the host page:
   - Match border radius, border color, shadow, spacing, and typography
   - Match hover and selected state palette with existing controls

## Accessibility Baseline
- Keep focus-visible styles obvious on trigger and options.
- Preserve keyboard dismissal (`Escape`).
- Use `aria` attributes consistently (`aria-haspopup`, `aria-expanded`, listbox semantics).

## Workflow
1. Scan target files for native `<select>`.
2. Replace visible native `<select>` with custom dropdown structure.
3. Implement JS interaction and state sync.
4. Verify visual consistency against the current page.
5. Re-run the scan and confirm no visible native `<select>` remains.

## Command
- Scan for native `<select>` usage:
  `bash scripts/check_native_select.sh [target_path]`

## Exceptions
- Only keep native `<select>` when the user explicitly requires native behavior.
- If native `<select>` must remain, document why and call out expected style limitations.

