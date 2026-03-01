<script setup>
import DonationPrompt from "../components/DonationPrompt.vue";
</script>

<template>
  <section class="flow-view" aria-label="Donate to support services">
    <div class="section-head section-head--spaced">
      <h2 class="section-head__title">Support the Service</h2>
      <p class="section-head__subtitle">
        Donations help keep API hosting and maintenance running for everyone.
      </p>
    </div>

    <DonationPrompt />
  </section>
</template>
