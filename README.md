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

- Router-based portal with dedicated routes for home, PDF merge flow, PDF split flow, image compression flow, image conversion flow, API contract, and admin reports
- Dedicated support/donation page with PayPal CTA
- Friendly landing page with service launcher cards
- Reusable `ToolCard` component for quick tool additions
- Mobile-first responsive layout
- Automated API health guard that polls backend and blocks actions with an overlay when server is down
- Guided PDF merge flow with file previews, drag-and-drop ordering, arrow ordering controls, and rotation before final merge
- Guided PDF split flow with multiple split strategies (range, selected pages, every N pages, custom groups)
- Guided PDF-to-Word extraction flow with hybrid native text + OCR fallback for scanned pages
- Guided image compression flow with preset modes (`light`, `balanced`, `aggressive`) and an `advanced` mode
- Multi-image compression with one ZIP download artifact
- Guided image conversion flow with target formats: `jpeg`, `png`, `webp`, `avif`, `tiff`, `gif`
- Transparent background UX for image conversion: single-image guard, auto/picker detection, and before/after preview
- Frontend upload guard for count, per-file size, and total request size limits
- Final-step progress bars with live upload telemetry plus real backend task-progress polling and ETA
- Donation prompt after successful service usage to help fund API uptime
- Admin reports view that reads backend request-failure report list/detail APIs

## PayPal donation link

Set the PayPal donation URL through Vite env variables:

```bash
VITE_PAYPAL_DONATE_URL=https://www.paypal.com/donate/?business=YOUR_PAYPAL_ACCOUNT
```

If this variable is not set, the UI falls back to `https://www.paypal.com/donate`.

This is a simple free of charge portal with multiple tools for formatting, merging, and compressing files.

## PDF-to-Word OCR alignment notes

Why this was added: frontend and backend now share an explicit contract for scanned/native PDF text extraction.

- Frontend calls `POST /api/pdf/extract-to-docx` with multipart field `files` and JSON string `extractOptions`.
- Users can choose OCR language per request: English (`eng`), Greek (`ell`), or both.
- Users can choose OCR quality per request: quick, better accuracy, maximum accuracy, or best possible accuracy.
- Backend runtime must have `tesseract` and `pdftoppm` installed, with `eng`/`ell` language data available.
- Output is text-first DOCX, so layout-heavy PDFs may not preserve exact visual structure.
