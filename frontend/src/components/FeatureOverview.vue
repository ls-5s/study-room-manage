<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

defineProps<{
  eyebrow: string
  summary: string
  responsibilities: readonly string[]
  status?: string
}>()

const route = useRoute()

const title = computed(() => route.meta.title ?? '校园自习室')
</script>

<template>
  <section class="feature-page" :aria-label="title">
    <h1 class="feature-title">{{ title }}</h1>
  </section>
</template>

<style scoped>
.feature-page {
  display: grid;
  min-height: 62svh;
  place-items: center;
  padding: 48px 24px;
  border: 1px solid var(--border);
  border-radius: 12px;
  background: var(--surface);
  box-shadow: var(--shadow-card);
}

.feature-title {
  margin: 0;
  color: var(--text);
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 650;
  letter-spacing: -0.04em;
  line-height: 1.2;
  text-align: center;
}

@media (max-width: 600px) {
  .feature-page {
    min-height: 52svh;
    padding: 36px 18px;
  }
}
</style>
