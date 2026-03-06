<script setup>
/*
  OpenAPI summary bullets now come from the shared locale store so the
  technical reference screen does not remain partially hardcoded.
*/
import { computed } from "vue";
import { usePortalI18n } from "../../i18n";

const { locale } = usePortalI18n();

const summaryItems = computed(() =>
  locale.value === "el"
    ? [
        "Το endpoint health χρησιμοποιείται για αυτόματο έλεγχο διαθεσιμότητας στο UI.",
        "Το PDF merge δέχεται `files[]` και προαιρετικό `mergePlan` σε μορφή JSON string.",
        "Το PDF split δέχεται ένα PDF `files[]` με modes: range, selected_pages, every_n_pages, custom_groups.",
        "Το PDF watermark υποστηρίζει overlay με κείμενο ή εικόνα μέσω `POST /api/pdf/watermark`.",
        "Η αρίθμηση σελίδων και το Bates numbering είναι διαθέσιμα μέσω `POST /api/pdf/page-numbers`.",
        "Οι αλλαγές σελίδων PDF (rotate/reorder/delete/keep) γίνονται με `POST /api/pdf/edit-pages`.",
        "Η εξαγωγή κειμένου από PDF σε `.txt` ή ZIP είναι διαθέσιμη στο `POST /api/pdf/extract-text`.",
        "Η μετατροπή εικόνων σε PDF είναι διαθέσιμη στο `POST /api/pdf/from-images`.",
        "Το PDF to Word δέχεται ένα PDF `files[]` και `extractOptions` JSON για συνδυασμένη native και OCR εξαγωγή.",
        "Το PDF to Word επιτρέπει επιλογή γλώσσας OCR ανά αίτημα: Αγγλικά, Ελληνικά ή και τα δύο.",
        "Το PDF to Word επιτρέπει επιλογή ποιότητας OCR: quick, better, maximum ή best possible accuracy.",
        "Η συμπίεση εικόνων δέχεται πολλές εικόνες και επιστρέφει ένα ZIP αρχείο.",
        "Τα modes συμπίεσης είναι: light, balanced, aggressive, advanced.",
        "Η μετατροπή εικόνων δέχεται πολλές εικόνες και μορφές jpeg/png/webp/avif/tiff/gif.",
        "Η αφαίρεση φόντου υποστηρίζει αυτόματη ή χειροκίνητη επιλογή με preview μίας εικόνας.",
        "Το `GET /api/tasks/:taskId` επιστρέφει πραγματική πρόοδο επεξεργασίας από το backend.",
        "Οι αναφορές admin απαιτούν `x-admin-token`, ενώ οι superadmins μπορούν να δουν και να ανακαλέσουν tokens.",
        "Τα μεταβαλλόμενα API requests έχουν rate limit ανά IP (προεπιλογή 5 requests/λεπτό).",
        "Όρια αποστολής: 20 αρχεία, 25 MB το καθένα, 120 MB συνολικά ανά αίτημα.",
      ]
    : [
        "Health endpoint is used for automatic availability checks in the UI.",
        "PDF merge accepts `files[]` and an optional `mergePlan` JSON string.",
        "PDF split accepts one `files[]` PDF with modes: range, selected_pages, every_n_pages, and custom_groups.",
        "PDF watermark supports text and image overlays through `POST /api/pdf/watermark`.",
        "PDF page numbering and Bates numbering are available through `POST /api/pdf/page-numbers`.",
        "PDF page edits (rotate, reorder, delete, keep) use `POST /api/pdf/edit-pages`.",
        "PDF text extraction to `.txt` or ZIP is available at `POST /api/pdf/extract-text`.",
        "Images to PDF conversion is available at `POST /api/pdf/from-images`.",
        "PDF to Word accepts one `files[]` PDF plus `extractOptions` JSON for hybrid native and OCR output.",
        "PDF to Word lets users choose OCR language per request: English, Greek, or both.",
        "PDF to Word lets users choose OCR quality mode: quick, better, maximum, or best possible accuracy.",
        "Image compression accepts multiple images and returns one ZIP file.",
        "Compression modes are: light, balanced, aggressive, and advanced.",
        "Image conversion accepts multiple images and target formats: jpeg, png, webp, avif, tiff, gif.",
        "Transparent background conversion supports automatic or picker-based detection with one-image preview.",
        "`GET /api/tasks/:taskId` returns real backend processing progress.",
        "Admin reports require `x-admin-token`, and superadmins can inspect and revoke token sessions.",
        "Mutating API requests are rate-limited per IP (5 requests per minute by default).",
        "Upload limits are 20 files, 25 MB each, and 120 MB total per request.",
      ]
);
</script>

<template>
  <aside class="quick-info" aria-label="OpenAPI summary">
    <h2 class="quick-info__title">
      {{ locale === "el" ? "Ανάλυση OpenAPI" : "OpenAPI Analysis" }}
    </h2>
    <ul class="quick-info__list">
      <li v-for="item in summaryItems" :key="item">{{ item }}</li>
    </ul>
  </aside>
</template>
