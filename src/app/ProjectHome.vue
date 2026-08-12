<script setup>
import { Card, Icon, Tooltip } from 'view-ui-plus'

defineProps({
  categories: { type: Array, required: true },
})

const emit = defineEmits(['select'])
</script>

<template>
  <main class="home-page">
    <header class="home-header">
      <span class="brand-mark"><Icon type="md-happy" size="24" /></span>
      <div class="home-title">
        <p>ZhangDW Projects</p>
        <h1>我的项目</h1>
      </div>
    </header>

    <section
      v-for="category in categories"
      :key="category.id"
      class="project-section"
      :class="`category-${category.id}`"
    >
      <header class="section-header">
        <span class="section-icon"><Icon :type="category.icon" size="20" /></span>
        <h2>{{ category.title }}</h2>
        <span class="section-line" />
      </header>

      <div class="project-grid">
        <Card
          v-for="project in category.projects"
          :key="project.id"
          class="project-card"
          :class="{ 'project-card--placeholder': !project.image }"
          :padding="0"
          tabindex="0"
          @click="emit('select', project)"
          @keydown.enter="emit('select', project)"
        >
          <div class="project-preview">
            <img v-if="project.image" :src="project.image" :alt="project.title" />
            <Icon v-else :type="project.icon" size="32" />
          </div>
          <div class="project-meta">
            <h3>{{ project.title }}</h3>
            <div v-if="project.platforms" class="platforms">
              <Tooltip v-if="project.platforms.includes('mobile')" content="支持移动端" placement="top">
                <Icon type="md-phone-portrait" size="16" />
              </Tooltip>
              <Tooltip v-if="project.platforms.includes('desktop')" content="支持桌面端" placement="top">
                <Icon type="md-desktop" size="16" />
              </Tooltip>
            </div>
          </div>
        </Card>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-page {
  width: min(1180px, 100%);
  min-height: 100dvh;
  margin: 0 auto;
  padding: 52px 24px 80px;
}

.home-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 27px;
  border-bottom: 2px dashed rgba(68, 89, 79, 0.26);
}

.brand-mark {
  width: 49px;
  height: 49px;
  display: grid;
  place-items: center;
  flex: none;
  border: 2px solid #41544b;
  border-radius: 7px 5px 8px 6px;
  background: #ffdc75;
  box-shadow: 3px 3px 0 #8fbba7;
  color: #41544b;
  transform: rotate(-2deg);
}

.home-header p {
  margin: 0 0 2px;
  color: var(--text-muted);
  font-size: 12px;
}

.home-header h1 {
  position: relative;
  z-index: 0;
  width: fit-content;
  margin: 0;
  font-family: "Hannotate SC", "Kaiti SC", STKaiti, KaiTi, sans-serif;
  font-size: 29px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0;
}

.home-header h1::after {
  content: "";
  position: absolute;
  right: -5px;
  bottom: 1px;
  left: -3px;
  z-index: -1;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 210, 79, 0.48);
  transform: rotate(-1deg);
}

.project-section {
  --category-color: #5f9d82;
  --category-soft: #edf7f2;
  --category-shadow: #bdd8ca;
  margin-top: 42px;
}

.category-games { --category-color: #d96f79; --category-soft: #fff0f2; --category-shadow: #efc2c6; }
.category-tools { --category-color: #4f9a78; --category-soft: #edf8f2; --category-shadow: #b9d9c8; }
.category-renders { --category-color: #6289c6; --category-soft: #eef4ff; --category-shadow: #c1d1ec; }
.category-shaders { --category-color: #9070b2; --category-soft: #f6f0fb; --category-shadow: #d4c3e3; }
.category-misc { --category-color: #c79232; --category-soft: #fff8e8; --category-shadow: #ead39d; }

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.section-icon {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  flex: none;
  border: 2px solid #53645b;
  border-radius: 50%;
  background: var(--category-soft);
  box-shadow: 2px 2px 0 var(--category-shadow);
  color: var(--category-color);
  transform: rotate(-3deg);
}

.section-header h2 {
  margin: 0;
  font-family: "Hannotate SC", "Kaiti SC", STKaiti, KaiTi, sans-serif;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  letter-spacing: 0;
  white-space: nowrap;
}

.section-line {
  height: 2px;
  flex: 1;
  border-radius: 50%;
  background: var(--category-shadow);
  opacity: 0.72;
  transform: rotate(-0.25deg);
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 18px;
}

.project-card {
  container-type: inline-size;
  overflow: hidden;
  border: 2px solid #586a61;
  border-radius: 8px 6px 7px 5px;
  background: #fffefa;
  cursor: pointer;
  box-shadow: 4px 4px 0 var(--category-shadow);
  transition: box-shadow 150ms ease, transform 150ms ease;
}

.project-card:hover,
.project-card:focus-visible {
  box-shadow: 5px 6px 0 var(--category-shadow);
  transform: translateY(-2px) rotate(-0.3deg);
  outline: none;
}

.project-preview {
  aspect-ratio: 16 / 10;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-bottom: 2px solid #586a61;
  background: var(--category-soft);
  color: var(--category-color);
}

.project-preview img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.project-meta {
  min-height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 13px 14px;
  background: #fffefa;
}

.project-meta h3 {
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--text-color);
  font-size: 15px;
  font-weight: 650;
  line-height: 1.4;
  letter-spacing: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.platforms {
  display: flex;
  gap: 6px;
  flex: none;
  color: var(--category-color);
}

@media (max-width: 920px) {
  .project-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (max-width: 640px) {
  .home-page { padding: 32px 16px 52px; }
  .home-header { padding-bottom: 23px; }
  .brand-mark { width: 43px; height: 43px; box-shadow: 3px 3px 0 #8fbba7; }
  .home-header h1 { font-size: 24px; }
  .project-section { margin-top: 32px; }
  .section-header { margin-bottom: 16px; }
  .section-icon { width: 32px; height: 32px; }
  .project-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px 12px; }
  .project-meta { min-height: 48px; padding: 11px 12px; }
  .project-card { box-shadow: 3px 3px 0 var(--category-shadow); }
  .project-card--placeholder :deep(.ivu-card-body) { height: calc(62.5cqw + 48px); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; background: var(--category-soft); }
  .project-card--placeholder .project-preview { width: auto; aspect-ratio: auto; border: 0; }
  .project-card--placeholder .project-meta { min-height: 0; padding: 0; justify-content: center; background: transparent; text-align: center; }
}

@media (max-width: 360px) {
  .project-grid { grid-template-columns: 1fr; }
}
</style>
