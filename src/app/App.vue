<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Spin } from 'view-ui-plus'
import ProjectHome from './ProjectHome.vue'
import ProjectShell from './ProjectShell.vue'
import { projectCategories, projects } from './projects.js'

const currentId = ref(window.location.hash.slice(1))
const currentProject = computed(() => projects.find((project) => project.id === currentId.value))

const updateViewportUnit = () => {
  const height = window.visualViewport?.height || window.innerHeight
  document.documentElement.style.setProperty('--app-vh', `${height * 0.01}px`)
}
let viewportRafId = null
const scheduleViewportUpdate = () => {
  if (viewportRafId) return
  viewportRafId = requestAnimationFrame(() => {
    viewportRafId = null
    updateViewportUnit()
  })
}
updateViewportUnit()
const viewportEvents = [
  [window, 'resize', scheduleViewportUpdate],
  [window, 'orientationchange', scheduleViewportUpdate],
  [document, 'fullscreenchange', scheduleViewportUpdate],
  [document, 'webkitfullscreenchange', scheduleViewportUpdate],
]
if (window.visualViewport) {
  viewportEvents.push([window.visualViewport, 'resize', scheduleViewportUpdate])
  viewportEvents.push([window.visualViewport, 'scroll', scheduleViewportUpdate])
}
viewportEvents.forEach(([target, type, listener]) => target.addEventListener(type, listener))
onBeforeUnmount(() => {
  if (viewportRafId) cancelAnimationFrame(viewportRafId)
  viewportEvents.forEach(([target, type, listener]) => target.removeEventListener(type, listener))
})

const currentPlatform = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'desktop'

function selectProject(project) {
  if (project.layout === 'fullscreen') {
    const url = `${window.location.origin}${window.location.pathname}#${project.id}`
    window.open(url, '_blank')
    return
  }
  if (currentPlatform() === 'mobile') {
    const root = document.documentElement
    const request = root.requestFullscreen || root.webkitRequestFullscreen
    if (!document.fullscreenElement && !document.webkitFullscreenElement && request) {
      Promise.resolve(request.call(root, { navigationUI: 'hide' })).catch(() => {})
    }
  }
  window.location.hash = project.id
}

function updateHash() {
  currentId.value = window.location.hash.slice(1)
}

window.addEventListener('hashchange', updateHash)
onBeforeUnmount(() => window.removeEventListener('hashchange', updateHash))

watch(currentProject, (project) => {
  document.title = project ? `${project.title} · ZhangDW` : 'ZhangDW Projects'
}, { immediate: true })
</script>

<template>
  <ProjectShell v-if="currentProject" :project="currentProject">
    <Suspense timeout="0">
      <component :is="currentProject.component" v-bind="currentProject.props" />
      <template #fallback>
        <div class="page-loading">
          <Spin size="large" />
          <span>加载中</span>
        </div>
      </template>
    </Suspense>
  </ProjectShell>
  <ProjectHome v-else :categories="projectCategories" @select="selectProject" />
</template>
