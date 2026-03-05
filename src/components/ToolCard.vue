<script setup>
/*
  Service cards now render service-specific graphics so users can quickly distinguish tools.
  Visual variants are chosen by a dedicated graphic key passed from the launcher.
*/
defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  tag: {
    type: String,
    required: true,
  },
  graphic: {
    type: String,
    default: "default",
  },
  variant: {
    type: String,
    default: "default",
  },
});

const emit = defineEmits(["action"]);
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
