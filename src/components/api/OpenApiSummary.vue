<template>
  <aside class="quick-info" aria-label="OpenAPI summary">
    <h2 class="quick-info__title">OpenAPI Analysis (Current)</h2>
    <ul class="quick-info__list">
      <li>Health endpoint is designed for automatic polling guard behavior in UI</li>
      <li>PDF merge accepts `files[]` and optional `mergePlan` JSON string</li>
      <li>
        PDF split accepts one `files[]` PDF with modes: range, selected_pages, every_n_pages,
        custom_groups
      </li>
      <li>
        PDF to Word extraction accepts one `files[]` PDF plus `extractOptions` JSON for hybrid
        native+OCR output
      </li>
      <li>PDF to Word lets users choose OCR language per request: English, Greek, or both</li>
      <li>
        PDF to Word lets users choose OCR quality mode: quick, better, maximum, or best possible
        accuracy
      </li>
      <li>Image compression accepts multiple images and returns one ZIP file</li>
      <li>Compression modes: light, balanced, aggressive, advanced</li>
      <li>
        Image conversion accepts multiple images and target formats: jpeg/png/webp/avif/tiff/gif
      </li>
      <li>
        Transparent background conversion uses automatic or picker-based detection and one-image
        preview mode
      </li>
      <li>
        `GET /api/tasks/:taskId` exposes real backend processing progress with initializing fallback
      </li>
      <li>
        `GET /api/admin/reports` and `GET /api/admin/reports/:fileName` expose failure reports
      </li>
      <li>Upload limits: 20 files, 25 MB each, 120 MB total per request</li>
    </ul>
  </aside>
</template>
