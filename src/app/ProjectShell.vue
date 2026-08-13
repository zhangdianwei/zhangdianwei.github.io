<script setup>
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  project: { type: Object, required: true },
})

let savedScrollY = 0
let locked = false

const preventContextMenu = (event) => event.preventDefault()

const lockScroll = () => {
  if (locked) return
  locked = true
  savedScrollY = window.scrollY || document.documentElement.scrollTop || 0
  document.documentElement.classList.add('fullscreen-lock')
  document.body.classList.add('fullscreen-lock')
  document.body.style.top = `-${savedScrollY}px`
  document.addEventListener('contextmenu', preventContextMenu)
}

const unlockScroll = () => {
  if (!locked) return
  locked = false
  document.documentElement.classList.remove('fullscreen-lock')
  document.body.classList.remove('fullscreen-lock')
  document.body.style.top = ''
  window.scrollTo(0, savedScrollY)
  document.removeEventListener('contextmenu', preventContextMenu)
}

watch(() => props.project.layout, (layout, previousLayout) => {
  if (layout === 'fullscreen') {
    lockScroll()
  } else if (previousLayout === 'fullscreen') {
    unlockScroll()
  }
}, { immediate: true })

onBeforeUnmount(unlockScroll)
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
  min-height: calc(var(--app-vh, 1vh) * 100);
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
