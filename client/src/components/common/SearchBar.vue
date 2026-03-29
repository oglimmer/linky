<script setup lang="ts">
import { useSearch } from '@/composables/useSearch'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/20/solid'

const { searchTerm, isServerSearch, submitSearch, clearSearch } = useSearch()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    submitSearch()
  }
}
</script>

<template>
  <div class="relative">
    <MagnifyingGlassIcon class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    <input
      v-model="searchTerm"
      @keydown="onKeydown"
      type="text"
      placeholder="Search... (Enter for full-text)"
      class="w-56 pl-8 pr-8 py-1.5 text-sm rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
    />
    <button
      v-if="searchTerm"
      @click="clearSearch"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    >
      <XMarkIcon class="w-4 h-4" />
    </button>
    <span v-if="isServerSearch" class="absolute -bottom-5 left-0 text-xs text-primary-500">Server search active</span>
  </div>
</template>
