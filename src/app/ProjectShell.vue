<script setup>
defineProps({
  project: { type: Object, required: true },
})
</script>

<template>
  <main class="project-shell" :class="{ 'layout-fullscreen': project.layout === 'fullscreen' }">
    <slot />
  </main>
</template>

<style scoped>
.project-shell {
  width: min(1440px, 100%);
  min-height: 100dvh;
  margin: 0 auto;
  padding: 24px;
  background: var(--page-background);
}

.layout-fullscreen {
  width: 100%;
  padding: 0;
}

@media (max-width: 640px) {
  .project-shell:not(.layout-fullscreen) { padding: 16px; }
}
</style>
