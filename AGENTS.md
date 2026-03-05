# AGENTS.md - softaware-tools

This file defines local agent instructions for `/Users/eevangelinos/Documents/softaware/softaware-tools`.

## 1) Instruction Priority

1. Follow global Codex/system/developer instructions first.
2. Then follow this local `AGENTS.md`.
3. If there is a conflict, higher-priority instructions win.

## 2) Core Project Rules

1. Keep UI/UX patterns consistent across all service flows.
2. Reuse shared components/composables; avoid duplicating view-specific logic.
3. For large added/modified code blocks, use concise multi-line block comments (`/* ... */`) above the block to explain the logic.
4. Keep error handling consistent and user-friendly (`code`, `message`, `details[]` where applicable).
5. Preserve responsiveness across mobile/tablet/desktop and avoid horizontal overflow regressions.
6. Keep feature rollout safe (prefer flags for large new domains such as JSON services).

## 3) Service Architecture Expectations

1. Existing user-facing services currently include:

- PDF Merge
- PDF Split
- PDF to Word OCR
- Image Compression
- Image Convert / Background removal
- JSON Services (hub + shared tool workspace)

2. JSON Services must remain registry-driven:

- Tool definitions in a single registry source.
- Shared workspace for input/options/output.
- Tool behavior resolved from definitions, not hardcoded per-view.

3. Prefer frontend-first implementation for mini-tools.
4. Add backend endpoints only when strictly necessary for browser-impossible behavior.

## 4) Testing Requirements (Mandatory)

When changing any service logic, update/add unit tests for the affected service modules.

### 4.1 Required Commands Before Finalizing

Run all of the following in `softaware-tools` unless explicitly told otherwise:

1. `npm run lint`
2. `npm test`
3. `npm run build`

### 4.2 Required Test Coverage by Service Area

Maintain and extend tests under `src/services/**/*.test.js` and `src/services/jsonTools/**/*.test.js`.

1. Shared API client (`src/services/apiClient.js`):

- URL building
- API error parsing and fallback behavior
- header extraction helpers
- multipart upload success/error paths

2. Health service (`src/services/healthService.js`):

- success mapping
- failure propagation

3. Admin reports service (`src/services/adminReportsService.js`):

- list/detail happy path
- encoded filename behavior
- fallback payload behavior
- failure propagation

4. Task service (`src/services/taskService.js`):

- `404 -> null`
- non-404 failures
- success mapping

5. PDF service (`src/services/pdfService.js`):

- merge/split/extract FormData composition
- optional taskId query propagation
- response metadata mapping

6. Image service (`src/services/imageService.js`):

- compress/convert/preview FormData composition
- optional taskId query propagation
- response metadata mapping

7. JSON services engine (`src/services/jsonTools/engine/*`):

- formatting/validation/repair
- conversions (YAML/XML/CSV/Base64/BSON/SQL)
- analyze/compare/structure behaviors
- engine dispatch and normalized errors
- visual render helper path (with mocks)
- registry integrity and presets/formatters behavior

### 4.3 Regression Rule

For every bug fix, add or update at least one test that fails before the fix and passes after.

## 5) API Alignment and Documentation Discipline

1. If frontend request/response expectations change in ways that affect `softaware-apis` contracts, coordinate backend updates.
2. When backend contract changes are required, ensure OpenAPI export is updated in `softaware-apis` so frontend/backend remain aligned.
3. If no backend contract changed, do not add unnecessary API changes.

## 6) UI Behavior Rules from Current Product Direction

1. Success/download flows should use shared overlay modal patterns where applicable.
2. Keep donate/support presentation consistent with current navigation and shared components.
3. Service launcher content should remain user-friendly, descriptive, and scannable.
4. Keep unique service card graphics meaningful and consistent with current visual language.

## 7) Change Summary Requirement

When completing work, include:

1. What changed.
2. Why the changes were necessary.
3. What tests/checks were run and their outcome.
