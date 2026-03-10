<script setup lang="ts">
/*
  Comparison pane headings now use the shared translation store so the JSON
  workspace reads naturally in both supported languages.
*/
import { usePortalI18n } from "../../i18n";
import type { PortalI18n } from "../../types/shared";

defineProps<{
  primaryInput?: string;
  secondaryInput?: string;
}>();

const { t } = usePortalI18n() as PortalI18n;
</script>

<template>
  <div class="json-diff-viewer">
    <article class="json-diff-viewer__pane">
      <h4 class="json-diff-viewer__title">{{ t("json.workspace.primaryInput") }}</h4>
      <pre class="report-json report-json--nested">{{ primaryInput }}</pre>
    </article>
    <article class="json-diff-viewer__pane">
      <h4 class="json-diff-viewer__title">{{ t("json.workspace.secondaryInput") }}</h4>
      <pre class="report-json report-json--nested">{{ secondaryInput }}</pre>
    </article>
  </div>
</template>
