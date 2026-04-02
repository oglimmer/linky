<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import AppHeader from './AppHeader.vue'
import AppFooter from './AppFooter.vue'
import RssDetails from '@/components/links/RssDetails.vue'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')
</script>

<template>
  <div class="min-h-screen flex flex-col" :class="isLoginPage ? 'bg-stone-100 dark:bg-stone-950' : ''">
    <AppHeader v-if="!isLoginPage" />
    <main class="flex-1 flex flex-col">
      <slot />
    </main>
    <AppFooter />
    <RssDetails />
  </div>
</template>
