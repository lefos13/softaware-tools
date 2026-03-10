<script setup lang="ts">
/*
  Service cards now render service-specific graphics so users can quickly distinguish tools.
  Visual variants are chosen by a dedicated graphic key passed from the launcher.
*/
defineProps<{
  title: string;
  description: string;
  tag: string;
  graphic?: string;
  variant?: string;
}>();

const emit = defineEmits<{
  action: [];
}>();
</script>

<template>
  <button
    type="button"
    class="tool-card tool-card--launcher tool-card--launcher-click"
    :class="`tool-card--${variant}`"
    @click="emit('action')"
  >
    <div class="tool-card__visual" aria-hidden="true">
      <svg v-if="graphic === 'pdf-merge'" viewBox="0 0 220 110" class="tool-card__graphic">
        <rect
          x="14"
          y="18"
          width="62"
          height="74"
          rx="10"
          class="tool-card__shape tool-card__shape--a"
        />
        <rect
          x="58"
          y="12"
          width="62"
          height="74"
          rx="10"
          class="tool-card__shape tool-card__shape--b"
        />
        <rect
          x="102"
          y="18"
          width="62"
          height="74"
          rx="10"
          class="tool-card__shape tool-card__shape--c"
        />
        <path d="M50 56h120" class="tool-card__line tool-card__line--merge" />
        <path d="M160 50l12 6-12 6" class="tool-card__line tool-card__line--merge" />
      </svg>
      <svg v-else-if="graphic === 'pdf-split'" viewBox="0 0 220 110" class="tool-card__graphic">
        <rect
          x="26"
          y="18"
          width="78"
          height="74"
          rx="12"
          class="tool-card__shape tool-card__shape--a"
        />
        <rect
          x="118"
          y="18"
          width="78"
          height="74"
          rx="12"
          class="tool-card__shape tool-card__shape--b"
        />
        <path d="M110 22v66" class="tool-card__line tool-card__line--split" />
        <path
          d="M100 48l10-10 10 10M100 62l10 10 10-10"
          class="tool-card__line tool-card__line--split"
        />
      </svg>
      <svg v-else-if="graphic === 'pdf-ocr'" viewBox="0 0 220 110" class="tool-card__graphic">
        <rect
          x="18"
          y="14"
          width="78"
          height="82"
          rx="12"
          class="tool-card__shape tool-card__shape--a"
        />
        <rect
          x="124"
          y="24"
          width="78"
          height="62"
          rx="12"
          class="tool-card__shape tool-card__shape--c"
        />
        <path
          d="M38 34h38M38 46h34M38 58h38M38 70h26"
          class="tool-card__line tool-card__line--ocr"
        />
        <path d="M101 54h20" class="tool-card__line tool-card__line--ocr" />
        <path d="M114 48l8 6-8 6" class="tool-card__line tool-card__line--ocr" />
      </svg>
      <svg
        v-else-if="graphic === 'image-compress'"
        viewBox="0 0 220 110"
        class="tool-card__graphic"
      >
        <rect
          x="18"
          y="16"
          width="84"
          height="78"
          rx="12"
          class="tool-card__shape tool-card__shape--a"
        />
        <rect
          x="126"
          y="28"
          width="72"
          height="54"
          rx="12"
          class="tool-card__shape tool-card__shape--b"
        />
        <path d="M112 55h10" class="tool-card__line tool-card__line--compress" />
        <path d="M118 50l8 5-8 5" class="tool-card__line tool-card__line--compress" />
      </svg>
      <svg v-else-if="graphic === 'image-convert'" viewBox="0 0 220 110" class="tool-card__graphic">
        <rect
          x="20"
          y="18"
          width="72"
          height="72"
          rx="12"
          class="tool-card__shape tool-card__shape--a"
        />
        <circle cx="162" cy="54" r="34" class="tool-card__shape tool-card__shape--c" />
        <path d="M94 35h18v18" class="tool-card__line tool-card__line--convert" />
        <path d="M112 35 90 57" class="tool-card__line tool-card__line--convert" />
        <path d="M130 74h-18V56" class="tool-card__line tool-card__line--convert" />
        <path d="M112 74l22-22" class="tool-card__line tool-card__line--convert" />
      </svg>
      <svg v-else-if="graphic === 'json-services'" viewBox="0 0 220 110" class="tool-card__graphic">
        <rect
          x="18"
          y="16"
          width="184"
          height="78"
          rx="14"
          class="tool-card__shape tool-card__shape--b"
        />
        <path
          d="M42 32c-10 0-10 12-10 22s0 22 10 22"
          class="tool-card__line tool-card__line--json"
        />
        <path
          d="M178 32c10 0 10 12 10 22s0 22-10 22"
          class="tool-card__line tool-card__line--json"
        />
        <path d="M86 40h48M86 55h36M86 70h48" class="tool-card__line tool-card__line--json" />
        <circle cx="72" cy="40" r="4" class="tool-card__shape tool-card__shape--c" />
        <circle cx="72" cy="55" r="4" class="tool-card__shape tool-card__shape--a" />
        <circle cx="72" cy="70" r="4" class="tool-card__shape tool-card__shape--c" />
      </svg>
      <svg v-else-if="graphic === 'books-editor'" viewBox="0 0 220 110" class="tool-card__graphic">
        <path
          d="M28 22c0-6 4-10 10-10h58c13 0 24 9 24 22v54H38c-6 0-10-4-10-10V22Z"
          class="tool-card__shape tool-card__shape--a"
        />
        <path
          d="M120 34c0-13 11-22 24-22h38c6 0 10 4 10 10v56c0 6-4 10-10 10h-62V34Z"
          class="tool-card__shape tool-card__shape--b"
        />
        <path d="M110 20v68" class="tool-card__line tool-card__line--books" />
        <path d="M52 40h42M52 54h34M52 68h44" class="tool-card__line tool-card__line--books" />
        <path d="M144 42l12 12 22-24" class="tool-card__line tool-card__line--books-check" />
      </svg>
      <svg v-else viewBox="0 0 220 110" class="tool-card__graphic">
        <rect
          x="10"
          y="15"
          width="80"
          height="80"
          rx="18"
          class="tool-card__shape tool-card__shape--a"
        />
        <circle cx="126" cy="55" r="34" class="tool-card__shape tool-card__shape--b" />
        <rect
          x="154"
          y="28"
          width="56"
          height="56"
          rx="16"
          class="tool-card__shape tool-card__shape--c"
        />
      </svg>
    </div>
    <p class="tool-card__tag">{{ tag }}</p>
    <h3 class="tool-card__title">{{ title }}</h3>
    <p class="tool-card__description">{{ description }}</p>
  </button>
</template>
