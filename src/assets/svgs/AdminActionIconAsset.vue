<script setup lang="ts">
/*
  Token-table action icons are keyed by action name so each button can reuse a
  shared asset component and keep the table template compact.
*/
defineProps<{
  name: "copy-id" | "details" | "history" | "reset-usage" | "edit" | "revoke" | "renew" | "extend";
}>();
</script>

<template>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path v-if="name === 'copy-id'" d="M9 9h9v12H9zM6 3h9v3h-2V5H8v10H6z" fill="currentColor" />

    <path
      v-else-if="name === 'details'"
      d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 15.2a1.2 1.2 0 1 1 1.2-1.2A1.2 1.2 0 0 1 12 17.2zm1.2-4.6h-2.1V7.2h2.1z"
      fill="currentColor"
    />

    <path
      v-else-if="name === 'history'"
      d="M12 5v7l5 3-.8 1.4L10.5 13V5zM12 2a10 10 0 1 1-9.9 9H4A8 8 0 1 0 12 4z"
      fill="currentColor"
    />

    <path
      v-else-if="name === 'reset-usage'"
      d="M12 6V2L7 7l5 5V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-6z"
      fill="currentColor"
    />

    <path
      v-else-if="name === 'edit'"
      d="M4 17.2V20h2.8l8.2-8.2-2.8-2.8zM17.7 4.3a1 1 0 0 1 1.4 0l1.6 1.6a1 1 0 0 1 0 1.4l-1.4 1.4-3-3z"
      fill="currentColor"
    />

    <path
      v-else-if="name === 'revoke'"
      d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 2a8 8 0 0 1 5.7 2.3L6.3 17.7A8 8 0 0 1 12 4zm0 16a8 8 0 0 1-5.7-2.3L17.7 6.3A8 8 0 0 1 12 20z"
      fill="currentColor"
    />

    <path
      v-else-if="name === 'renew'"
      d="M12 6V2l5 5-5 5V8a4 4 0 1 0 4 4h2a6 6 0 1 1-6-6z"
      fill="currentColor"
    />

    <path v-else d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" fill="currentColor" />
  </svg>
</template>
