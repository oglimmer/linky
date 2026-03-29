<script setup lang="ts">
import { watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useLinksStore } from '@/stores/links'
import { useTagsStore } from '@/stores/tags'
import { useSearch } from '@/composables/useSearch'
import { useRssPolling } from '@/composables/useRssPolling'
import TagNav from '@/components/tags/TagNav.vue'
import LinkForm from '@/components/links/LinkForm.vue'
import LinkList from '@/components/links/LinkList.vue'
import { PlusIcon } from '@heroicons/vue/20/solid'

const route = useRoute()
const linksStore = useLinksStore()
const tagsStore = useTagsStore()
const { filteredLinks } = useSearch()

useRssPolling()

async function loadData(tag: string) {
  await Promise.all([
    linksStore.fetchLinks(tag),
    !tagsStore.flatTags?.length ? tagsStore.fetchHierarchy() : Promise.resolve(),
  ])
}

onMounted(() => {
  const tag = (route.params.tag as string) || 'portal'
  loadData(tag)
})

watch(() => route.params.tag, (newTag) => {
  if (newTag && typeof newTag === 'string') {
    linksStore.stopEditing()
    loadData(newTag)
  }
})

function toggleForm() {
  if (linksStore.showForm) {
    linksStore.stopEditing()
    linksStore.showForm = false
  } else {
    linksStore.showForm = true
  }
}
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 py-6">
    <div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      <!-- Sidebar: Tag navigation -->
      <aside class="space-y-4">
        <TagNav />
      </aside>

      <!-- Main content -->
      <div class="space-y-4">
        <!-- Add link button + form -->
        <div class="flex items-center gap-3">
          <button
            @click="toggleForm"
            :class="[
              'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition',
              linksStore.showForm
                ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                : 'bg-primary-600 text-white hover:bg-primary-700',
            ]"
          >
            <PlusIcon class="w-4 h-4" />
            {{ linksStore.showForm ? 'Cancel' : 'Add Link' }}
          </button>
        </div>

        <LinkForm v-if="linksStore.showForm" />

        <!-- Loading -->
        <div v-if="linksStore.loading" class="py-12 text-center text-sm text-gray-400">Loading links...</div>

        <!-- Link list -->
        <LinkList v-else :links="filteredLinks" />
      </div>
    </div>
  </div>
</template>
