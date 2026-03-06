<script setup>
/*
  JSON output actions now use shared translated labels so the workspace controls
  remain consistent with the selected language.
*/
import { usePortalI18n } from "../../i18n";
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  outputUrl: {
    type: String,
    default: "",
  },
  downloadFileName: {
    type: String,
    default: "json-output.txt",
  },
});

const emit = defineEmits(["copy", "clear"]);
const { t } = usePortalI18n();

/*
  Download clicks should only be blocked when there is no generated output.
  Preventing all anchor clicks stops browser downloads even when a file is ready.
*/
const onDownloadClick = (event) => {
  if (!event) {
    return;
  }
  if (props.disabled || !props.outputUrl) {
    event.preventDefault();
  }
};
</script>

<template>
  <div class="json-actions">
    <button
      type="button"
      class="button button--secondary"
      :disabled="disabled"
      @click="emit('copy')"
    >
      {{ t("json.workspace.copyOutput") }}
    </button>
    <a
      class="button button--primary json-actions__download"
      :class="{ 'json-actions__download--disabled': !outputUrl || disabled }"
      :href="disabled ? '' : outputUrl"
      :download="downloadFileName"
      @click="onDownloadClick"
    >
      {{ t("json.workspace.download") }}
    </a>
    <button type="button" class="button button--secondary" @click="emit('clear')">
      {{ t("json.workspace.clearAll") }}
    </button>
  </div>
</template>
