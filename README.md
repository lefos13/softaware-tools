<!-- Updated to document how to run and extend the new Vue portal starter for file-formatting tools. -->

# Softaware Tools Portal (Vue Starter)

Starter Vue + Vite project for a user-friendly tools portal (no login required) where people can quickly access utilities like PDF merging, image conversion, and file formatting.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

<!-- Added this section so frontend and backend contributors use the same lint/format/hook workflow before merging changes. -->

## Code Quality Tooling

```bash
# check lint rules
npm run lint

# auto-fix lint issues where possible
npm run lint:fix

# format all supported files
npm run format

# check formatting without writing changes
npm run format:check
```

Husky is configured with a `pre-commit` hook that runs `lint-staged`, which means only staged files are linted/formatted before each commit.

## Current Starter Includes

- Friendly landing page with service launcher cards
- Reusable `ToolCard` component for quick tool additions
- Mobile-first responsive layout
- Automated API health guard that polls backend and blocks actions with an overlay when server is down
- Guided PDF merge flow with file previews, drag-and-drop ordering, arrow ordering controls, and rotation before final merge
- Guided image compression flow with preset modes (`light`, `balanced`, `aggressive`) and an `advanced` mode
- Multi-image compression with one ZIP download artifact
- Frontend upload guard for count, per-file size, and total request size limits

This is a simple free of charge portal with multiple tools for formatting, merging, and compressing files.
