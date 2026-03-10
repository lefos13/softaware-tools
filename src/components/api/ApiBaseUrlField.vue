<script setup lang="ts">
/*
  The API base URL label now uses the shared locale store so the connection
  field matches the selected language of the rest of the shell.
*/
import { usePortalI18n } from "../../i18n";
import type { PortalI18n } from "../../types/shared";

defineProps<{
  modelValue: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
const { t } = usePortalI18n() as PortalI18n;

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  emit("update:modelValue", target?.value.trim() || "");
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
