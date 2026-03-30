<script setup lang="ts">
import { computed } from 'vue'
import { useLinksStore } from '@/stores/links'

const props = defineProps<{ linkId: number }>()
const linksStore = useLinksStore()

const items = computed(() => linksStore.rssDetails[props.linkId] ?? [])

function openAndDismiss(index: number, e: MouseEvent) {
  e.preventDefault()
  const url = items.value[index]?.link
  if (url) window.open(url, '_blank', 'noopener')
  linksStore.dismissRssItem(props.linkId, index)
}
</script>

<template>
  <div v-if="items.length" class="px-4 pb-3 pl-11">
    <div class="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-3 space-y-1.5">
      <a
        v-for="(item, i) in items"
        :key="i"
        :href="item.link"
        target="_blank"
        rel="noopener"
        class="block text-xs text-amber-800 dark:text-amber-300 hover:underline truncate"
        @click="openAndDismiss(i, $event)"
      >
        {{ item.title }}
      </a>
    </div>
  </div>
</template>
