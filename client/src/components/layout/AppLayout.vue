<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')
</script>

<template>
  <div class="min-h-screen flex flex-col" :class="isLoginPage ? 'bg-gradient-to-br from-primary-50 to-blue-100 dark:from-gray-950 dark:to-gray-900' : ''">
    <AppHeader v-if="!isLoginPage" />
    <main class="flex-1 flex flex-col">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
