<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="border-t border-stone-200 dark:border-stone-800 py-5 text-center text-xs text-stone-400 space-y-1.5">
    <div class="font-[--font-display] font-medium tracking-tight text-stone-500 dark:text-stone-400">Linky</div>
    <nav class="flex justify-center gap-4">
      <RouterLink to="/privacy" class="hover:text-primary-600 dark:hover:text-primary-400 transition">Privacy</RouterLink>
      <RouterLink to="/terms" class="hover:text-primary-600 dark:hover:text-primary-400 transition">Terms</RouterLink>
      <RouterLink to="/imprint" class="hover:text-primary-600 dark:hover:text-primary-400 transition">Imprint</RouterLink>
    </nav>
  </footer>
</template>
