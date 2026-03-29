<script setup lang="ts">
import type { Link, SortColumn, LinkColumn } from '@/types'
import { useLinksStore } from '@/stores/links'
import LinkItem from './LinkItem.vue'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/vue/20/solid'

defineProps<{ links: Link[] }>()

const linksStore = useLinksStore()

const sortOptions: { key: SortColumn; label: string }[] = [
  { key: 'lastAdded', label: 'Newest' },
  { key: 'lastUsed', label: 'Last used' },
  { key: 'mostUsed', label: 'Most used' },
  { key: 'title', label: 'Title' },
  { key: 'url', label: 'URL' },
]

const columnOptions: { key: LinkColumn; label: string }[] = [
  { key: 'pageTitle', label: 'Title' },
  { key: 'linkUrl', label: 'URL' },
  { key: 'notes', label: 'Notes' },
  { key: 'tags', label: 'Tags' },
  { key: 'rssUrl', label: 'RSS' },
]
</script>

<template>
  <div>
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center gap-3 mb-3">
      <!-- Sort buttons -->
      <div class="flex items-center gap-1">
        <span class="text-xs text-gray-400 mr-1">Sort:</span>
        <button
          v-for="opt in sortOptions"
          :key="opt.key"
          @click="linksStore.setSort(opt.key)"
          :class="[
            'inline-flex items-center gap-0.5 px-2 py-1 rounded text-xs font-medium transition',
            linksStore.sortColumn === opt.key
              ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
              : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800',
          ]"
        >
          {{ opt.label }}
          <template v-if="linksStore.sortColumn === opt.key">
            <ChevronUpIcon v-if="linksStore.sortOrder === 1" class="w-3 h-3" />
            <ChevronDownIcon v-else class="w-3 h-3" />
          </template>
        </button>
      </div>

      <!-- Column toggles -->
      <div class="flex items-center gap-1 ml-auto">
        <span class="text-xs text-gray-400 mr-1">Show:</span>
        <label
          v-for="col in columnOptions"
          :key="col.key"
          class="inline-flex items-center gap-1 text-xs text-gray-500 cursor-pointer select-none"
        >
          <input
            type="checkbox"
            :checked="linksStore.visibleColumns.includes(col.key)"
            @change="linksStore.toggleColumn(col.key)"
            class="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3 h-3"
          />
          {{ col.label }}
        </label>
      </div>
    </div>

    <!-- Link list -->
    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
      <div v-if="links.length === 0" class="py-12 text-center text-sm text-gray-400">
        No links found
      </div>
      <LinkItem v-for="link in links" :key="link.id" :link="link" />
    </div>

    <p class="mt-2 text-xs text-gray-400 text-right">{{ links.length }} link{{ links.length !== 1 ? 's' : '' }}</p>
  </div>
</template>
