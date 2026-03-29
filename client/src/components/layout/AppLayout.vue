<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader v-if="!isLoginPage" />
    <main class="flex-1">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
