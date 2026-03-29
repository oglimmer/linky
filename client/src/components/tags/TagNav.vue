<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useTagsStore } from '@/stores/tags'
import { useLinksStore } from '@/stores/links'
import { ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/vue/20/solid'

const tagsStore = useTagsStore()
const linksStore = useLinksStore()

const tagFilter = ref('')

const currentTag = computed(() => linksStore.selectedTag)
const parent = computed(() => tagsStore.getParent(currentTag.value))
const siblings = computed(() => tagsStore.getSiblings(currentTag.value))
const children = computed(() => tagsStore.getChildren(currentTag.value))

const q = computed(() => tagFilter.value.toLowerCase())

// When filtering, search all tags in the hierarchy; otherwise show contextual siblings/children
const matchingTags = computed(() => {
  if (!q.value) return []
  return tagsStore.flatTags
    .filter(t => t.name.toLowerCase().includes(q.value) && t.name !== currentTag.value)
    .slice(0, 20)
})

// Clear filter on tag change
watch(currentTag, () => { tagFilter.value = '' })

function countFor(name: string) {
  return tagsStore.tagCount?.[name] ?? 0
}
</script>

<template>
  <nav class="space-y-3">
    <!-- Tag search -->
    <div class="flex items-center gap-1.5 border-b border-stone-200 dark:border-stone-700 pb-1">
      <MagnifyingGlassIcon class="w-3.5 h-3.5 text-stone-400 shrink-0" />
      <input
        v-model="tagFilter"
        type="text"
        placeholder="Search tags..."
        class="w-full bg-transparent text-xs text-stone-600 dark:text-stone-300 placeholder-stone-400 outline-none"
      />
    </div>

    <!-- Global search results (when typing) -->
    <template v-if="q">
      <div v-if="matchingTags.length" class="flex flex-wrap gap-1.5">
        <RouterLink
          v-for="tag in matchingTags"
          :key="tag.name"
          :to="`/links/${tag.name}`"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:text-primary-700 dark:hover:text-primary-300 transition"
        >
          {{ tag.name }}
          <span class="text-stone-400">({{ countFor(tag.name) }})</span>
        </RouterLink>
      </div>
      <p v-else class="text-xs text-stone-400">No tags found</p>
    </template>

    <!-- Normal tag context (when not searching) -->
    <template v-else>
      <!-- Breadcrumb / parent -->
      <div v-if="parent" class="flex items-center gap-1 text-xs text-stone-400">
        <RouterLink :to="`/links/${parent}`" class="hover:text-primary-600 transition">{{ parent }}</RouterLink>
        <ChevronRightIcon class="w-3 h-3" />
        <span class="text-stone-700 dark:text-stone-200 font-medium">{{ currentTag }}</span>
      </div>

      <!-- Current tag -->
      <h2 class="font-[--font-display] text-lg font-semibold text-stone-800 dark:text-stone-200 tracking-tight">
        {{ currentTag }}
        <span class="text-sm font-normal text-stone-400 ml-1">({{ countFor(currentTag) }})</span>
      </h2>

      <!-- Siblings -->
      <div v-if="siblings.length" class="flex flex-wrap gap-1.5">
        <RouterLink
          v-for="sib in siblings"
          :key="sib.name"
          :to="`/links/${sib.name}`"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:text-primary-700 dark:hover:text-primary-300 transition"
        >
          {{ sib.name }}
          <span class="text-stone-400">({{ countFor(sib.name) }})</span>
        </RouterLink>
      </div>

      <!-- Children -->
      <div v-if="children.length">
        <p class="text-xs text-stone-400 mb-1.5">Subtags</p>
        <div class="flex flex-wrap gap-1.5">
          <RouterLink
            v-for="child in children"
            :key="child.name"
            :to="`/links/${child.name}`"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-50 dark:bg-primary-950/50 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition"
          >
            {{ child.name }}
            <span class="opacity-60">({{ countFor(child.name) }})</span>
          </RouterLink>
        </div>
      </div>
    </template>
  </nav>
</template>
