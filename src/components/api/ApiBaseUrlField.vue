<script setup>
// This component was added to standardize API base-url input and keep top-level layout independent from form-control behavior.
defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue"]);

const onInput = (event) => {
  emit("update:modelValue", event.target.value.trim());
};
</script>

<template>
  <div class="hero__actions hero__actions--api">
    <label for="apiBaseUrl">API Base URL</label>
    <input
      id="apiBaseUrl"
      :value="modelValue"
      type="url"
      class="api-base-url-input"
      @input="onInput"
    />
  </div>
</template>
