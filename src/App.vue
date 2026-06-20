<template>
  <div class="app-root">
    <router-view v-slot="{ Component, route }">
      <Transition name="page-fade" mode="out-in">
        <component :is="Component" :key="route.fullPath" />
      </Transition>
    </router-view>
  </div>
</template>

<style lang="scss" scoped>
.app-root {
  min-height: 100vh;
}
.page-fade-enter-active,
.page-fade-leave-active {
  transition: opacity 0.22s ease;
}
.page-fade-enter-from,
.page-fade-leave-to {
  opacity: 0;
}
</style>
