<script setup>
/*
  Shared output actions avoid repeated copy/download button logic across tools
  and keep completion controls consistent within JSON workspace.
*/
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
      Copy output
    </button>
    <a
      class="button button--primary json-actions__download"
      :class="{ 'json-actions__download--disabled': !outputUrl || disabled }"
      :href="disabled ? '' : outputUrl"
      :download="downloadFileName"
      @click="onDownloadClick"
    >
      Download
    </a>
    <button type="button" class="button button--secondary" @click="emit('clear')">Clear all</button>
  </div>
</template>
