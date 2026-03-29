<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="border-t border-gray-200 dark:border-gray-800 py-4 text-center text-xs text-gray-400 space-y-1">
    <div>Linky &mdash; Bookmark Manager</div>
    <nav class="flex justify-center gap-4">
      <RouterLink to="/privacy" class="hover:text-gray-600 dark:hover:text-gray-300 transition">Privacy</RouterLink>
      <RouterLink to="/terms" class="hover:text-gray-600 dark:hover:text-gray-300 transition">Terms</RouterLink>
      <RouterLink to="/imprint" class="hover:text-gray-600 dark:hover:text-gray-300 transition">Imprint</RouterLink>
    </nav>
  </footer>
</template>
