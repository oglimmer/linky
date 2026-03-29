<script setup lang="ts">
import { computed } from 'vue'
import { useLinksStore } from '@/stores/links'

const props = defineProps<{ linkId: number }>()
const linksStore = useLinksStore()

const items = computed(() => linksStore.rssDetails[props.linkId] ?? [])
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
      >
        {{ item.title }}
      </a>
    </div>
  </div>
</template>
