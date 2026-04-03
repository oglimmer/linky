<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Link, LinkColumn } from '@/types'
import { useLinksStore } from '@/stores/links'
import { useAuthStore } from '@/stores/auth'
import { PencilSquareIcon, GlobeAltIcon } from '@heroicons/vue/20/solid'

const props = defineProps<{ link: Link }>()
const linksStore = useLinksStore()
const authStore = useAuthStore()

const cols = computed(() => linksStore.visibleColumns)
const rssCount = computed(() => linksStore.rssUpdates[props.link.id] ?? 0)
const faviconError = ref(false)

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
  window.open(`/leave?target=${props.link.id}&token=${authStore.token}`, '_blank')
}
</script>

<template>
  <div class="group">
    <div class="flex items-start gap-3 py-3 px-4 hover:bg-primary-50/50 dark:hover:bg-primary-950/30 transition-colors duration-150">
      <!-- Favicon -->
      <img
        v-if="link.faviconUrl && !faviconError"
        :src="`/rest/links/${link.id}/favicon`"
        class="w-4 h-4 mt-1 shrink-0 rounded"
        loading="lazy"
        alt=""
        @error="faviconError = true"
      />
      <GlobeAltIcon v-else class="w-4 h-4 mt-1 shrink-0 text-stone-400 dark:text-stone-500" />

      <!-- Content -->
      <div class="flex-1 min-w-0 space-y-0.5">
        <div class="flex items-center gap-2">
          <button @click="openLink" class="text-sm font-medium text-stone-800 dark:text-stone-200 hover:text-primary-700 dark:hover:text-primary-400 hover:underline decoration-primary-300 underline-offset-2 truncate text-left transition-colors">
            {{ show('pageTitle') && link.pageTitle ? link.pageTitle : truncateUrl(link.linkUrl) }}
          </button>
          <span v-if="rssCount > 0" @click="linksStore.fetchRssDetails(link.id)" class="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300 cursor-pointer hover:bg-amber-200 transition">
            {{ rssCount }} new
          </span>
        </div>

        <p v-if="show('linkUrl') && link.pageTitle" class="text-xs text-stone-400 truncate">{{ truncateUrl(link.linkUrl) }}</p>
        <p v-if="show('notes') && link.notes" class="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">{{ link.notes }}</p>
        <p v-if="show('rssUrl') && link.rssUrl" class="text-xs text-stone-400 truncate">RSS: {{ link.rssUrl }}</p>

        <div v-if="show('tags')" class="flex flex-wrap gap-1 mt-1">
          <RouterLink
            v-for="tag in link.tags"
            :key="tag"
            :to="`/links/${tag}`"
            class="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 hover:bg-primary-100 dark:hover:bg-primary-900/50 hover:text-primary-700 dark:hover:text-primary-300 transition"
          >
            {{ tag }}
          </RouterLink>
        </div>
      </div>

      <!-- Actions -->
      <div class="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
        <button
          @click="linksStore.startEditing(link)"
          class="p-1.5 rounded-md text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 hover:text-stone-600 transition"
        >
          <PencilSquareIcon class="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
</template>
