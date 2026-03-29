<script setup lang="ts">
import { computed } from 'vue'
import { useTagsStore } from '@/stores/tags'
import { useLinksStore } from '@/stores/links'
import { ChevronRightIcon } from '@heroicons/vue/20/solid'

const tagsStore = useTagsStore()
const linksStore = useLinksStore()

const currentTag = computed(() => linksStore.selectedTag)
const parent = computed(() => tagsStore.getParent(currentTag.value))
const siblings = computed(() => tagsStore.getSiblings(currentTag.value))
const children = computed(() => tagsStore.getChildren(currentTag.value))

function countFor(name: string) {
  return tagsStore.tagCount?.[name] ?? 0
}
</script>

<template>
  <nav class="space-y-3">
    <!-- Breadcrumb / parent -->
    <div v-if="parent" class="flex items-center gap-1 text-xs text-gray-400">
      <RouterLink :to="`/links/${parent}`" class="hover:text-primary-600 transition">{{ parent }}</RouterLink>
      <ChevronRightIcon class="w-3 h-3" />
      <span class="text-gray-700 dark:text-gray-200 font-medium">{{ currentTag }}</span>
    </div>

    <!-- Current tag -->
    <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
      {{ currentTag }}
      <span class="text-sm font-normal text-gray-400 ml-1">({{ countFor(currentTag) }})</span>
    </h2>

    <!-- Siblings -->
    <div v-if="siblings.length" class="flex flex-wrap gap-1.5">
      <RouterLink
        v-for="sib in siblings"
        :key="sib.name"
        :to="`/links/${sib.name}`"
        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-700 transition"
      >
        {{ sib.name }}
        <span class="text-gray-400">({{ countFor(sib.name) }})</span>
      </RouterLink>
    </div>

    <!-- Children -->
    <div v-if="children.length">
      <p class="text-xs text-gray-400 mb-1.5">Subtags</p>
      <div class="flex flex-wrap gap-1.5">
        <RouterLink
          v-for="child in children"
          :key="child.name"
          :to="`/links/${child.name}`"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900 transition"
        >
          {{ child.name }}
          <span class="opacity-60">({{ countFor(child.name) }})</span>
        </RouterLink>
      </div>
    </div>
  </nav>
</template>
