<script setup lang="ts">
/*
  Bell variants for request notifications are stored centrally so the admin view
  only toggles state and count while icon markup remains reusable.
*/
defineProps<{
  pending: boolean;
}>();
</script>

<template>
  <svg v-if="pending" viewBox="0 0 24 24" fill="none" role="presentation">
    <path
      d="M7 9a5 5 0 1 1 10 0v3.08c0 .7.19 1.4.55 2l1.1 1.82A1 1 0 0 1 17.79 18H6.21a1 1 0 0 1-.86-1.5l1.1-1.82c.36-.6.55-1.3.55-2V9Z"
      fill="currentColor"
    />
    <path
      d="M9.75 19a2.25 2.25 0 0 0 4.5 0"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M18.4 5.6 20 4m-1 5.2 2 .2"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
    />
  </svg>

  <svg v-else viewBox="0 0 24 24" fill="none" role="presentation">
    <path
      d="M7 9a5 5 0 1 1 10 0v3.08c0 .7.19 1.4.55 2l1.1 1.82A1 1 0 0 1 17.79 18H6.21a1 1 0 0 1-.86-1.5l1.1-1.82c.36-.6.55-1.3.55-2V9Z"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linejoin="round"
    />
    <path
      d="M9.75 19a2.25 2.25 0 0 0 4.5 0"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
