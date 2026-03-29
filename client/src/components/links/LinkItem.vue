<script setup lang="ts">
import { computed } from 'vue'
import type { Link, LinkColumn } from '@/types'
import { useLinksStore } from '@/stores/links'
import { PencilSquareIcon } from '@heroicons/vue/20/solid'
import RssDetails from './RssDetails.vue'

const props = defineProps<{ link: Link }>()
const linksStore = useLinksStore()

const cols = computed(() => linksStore.visibleColumns)
const rssCount = computed(() => linksStore.rssUpdates[props.link.id] ?? 0)
const isRssExpanded = computed(() => linksStore.expandedRssId === props.link.id)

function show(col: LinkColumn) {
  return cols.value.includes(col)
}

function truncateUrl(url: string): string {
  const slashIdx = url.indexOf('/', url.indexOf('//') + 2)
  if (slashIdx === -1) return url
  if (url.length <= 80) return url
  return url.substring(0, 80) + '[...]'
}

function openLink() {
  linksStore.clickLink(props.link.id)
  window.open(`/leave?target=${props.link.id}`, '_blank')
}
</script>

<template>
  <div class="group border-b border-gray-100 dark:border-gray-800 last:border-0">
    <div class="flex items-start gap-3 py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <!-- Favicon -->
      <img
        v-if="link.faviconUrl"
        :src="`/rest/links/${link.id}/favicon`"
        class="w-4 h-4 mt-1 shrink-0 rounded"
        loading="lazy"
        alt=""
      />
      <div v-else class="w-4 h-4 mt-1 shrink-0 rounded bg-gray-200 dark:bg-gray-700" />

      <!-- Content -->
      <div class="flex-1 min-w-0 space-y-0.5">
        <div class="flex items-center gap-2">
          <button @click="openLink" class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline truncate text-left">
            {{ show('pageTitle') && link.pageTitle ? link.pageTitle : truncateUrl(link.linkUrl) }}
          </button>
          <span v-if="rssCount > 0" @click="linksStore.fetchRssDetails(link.id)" class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 cursor-pointer hover:bg-amber-200 transition">
            {{ rssCount }} new
          </span>
        </div>

        <p v-if="show('linkUrl') && link.pageTitle" class="text-xs text-gray-400 truncate">{{ truncateUrl(link.linkUrl) }}</p>
        <p v-if="show('notes') && link.notes" class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{{ link.notes }}</p>

        <div v-if="show('tags')" class="flex flex-wrap gap-1 mt-1">
          <RouterLink
            v-for="tag in link.tags"
            :key="tag"
            :to="`/links/${tag}`"
            class="inline-block px-1.5 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900 hover:text-primary-700 transition"
          >
            {{ tag }}
          </RouterLink>
        </div>
      </div>

      <!-- Actions -->
      <button
        @click="linksStore.startEditing(link)"
        class="shrink-0 p-1.5 rounded-md text-gray-400 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 transition"
      >
        <PencilSquareIcon class="w-4 h-4" />
      </button>
    </div>

    <!-- RSS details expansion -->
    <RssDetails v-if="isRssExpanded" :link-id="link.id" />
  </div>
</template>
