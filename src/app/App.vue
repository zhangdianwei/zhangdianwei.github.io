<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Message, Spin } from 'view-ui-plus'
import ProjectHome from './ProjectHome.vue'
import ProjectShell from './ProjectShell.vue'
import { projectCategories, projects } from './projects.js'

const currentId = ref(window.location.hash.slice(1))
const currentProject = computed(() => projects.find((project) => project.id === currentId.value))

const platformNames = { mobile: '移动端', desktop: '桌面端' }
const currentPlatform = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
const supportsPlatform = (project) => !project.platforms || project.platforms.includes(currentPlatform())

function selectProject(project) {
  if (!supportsPlatform(project)) {
    Message.warning(`该项目仅支持${project.platforms.map((platform) => platformNames[platform]).join('、')}`)
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
  if (project && !supportsPlatform(project)) {
    Message.warning(`该项目仅支持${project.platforms.map((platform) => platformNames[platform]).join('、')}`)
    window.location.hash = ''
  }
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
