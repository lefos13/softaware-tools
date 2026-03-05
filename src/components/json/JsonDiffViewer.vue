<script setup>
/*
  Side-by-side input viewer helps compare-style tools keep both source documents
  visible in the shared workspace without introducing separate pages.
*/
defineProps({
  primaryInput: {
    type: String,
    default: "",
  },
  secondaryInput: {
    type: String,
    default: "",
  },
});
</script>

<template>
  <div class="json-diff-viewer">
    <article class="json-diff-viewer__pane">
      <h4 class="json-diff-viewer__title">Primary Input</h4>
      <pre class="report-json report-json--nested">{{ primaryInput }}</pre>
    </article>
    <article class="json-diff-viewer__pane">
      <h4 class="json-diff-viewer__title">Secondary Input</h4>
      <pre class="report-json report-json--nested">{{ secondaryInput }}</pre>
    </article>
  </div>
</template>
