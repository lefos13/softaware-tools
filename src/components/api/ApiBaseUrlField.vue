<script setup>
/*
  The API base URL label now uses the shared locale store so the connection
  field matches the selected language of the rest of the shell.
*/
import { usePortalI18n } from "../../i18n";

defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);
const { t } = usePortalI18n();

const onInput = (event) => {
  emit("update:modelValue", event.target.value.trim());
};
</script>

<template>
  <div class="hero__actions hero__actions--api">
    <label for="apiBaseUrl">{{ t("apiBaseUrl.label") }}</label>
    <input
      id="apiBaseUrl"
      :value="modelValue"
      type="url"
      class="api-base-url-input"
      @input="onInput"
    />
  </div>
</template>
