<script setup lang="ts">
import { ref } from 'vue'
import { useTagsStore } from '@/stores/tags'
import TagNode from './TagNode.vue'

const tagsStore = useTagsStore()
const rootDragOver = ref(false)

function onRootDragOver(e: DragEvent) {
  if (!tagsStore.dragging) return
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
  rootDragOver.value = true
}

function onRootDragLeave() {
  rootDragOver.value = false
}

function onRootDrop(e: DragEvent) {
  e.preventDefault()
  rootDragOver.value = false
  const tagName = tagsStore.dragging
  if (!tagName) return
  const rootChildren = tagsStore.flatTags
    .filter(t => t.parent === 'root')
    .sort((a, b) => a.index - b.index)
  tagsStore.moveTag(tagName, 'root', rootChildren.length)
  tagsStore.saveHierarchy()
}
</script>

<template>
  <div class="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-y-auto max-h-[calc(100vh-16rem)]">
    <div v-if="tagsStore.loading" class="py-12 text-center text-sm text-stone-400">Loading tags...</div>
    <div v-else-if="!tagsStore.tree?.length" class="py-12 text-center text-sm text-stone-400">No tags yet</div>
    <div v-else class="py-2">
      <TagNode v-for="node in tagsStore.tree" :key="node.name" :node="node" />
      <!-- Root-level drop zone at the bottom -->
      <div
        @dragover="onRootDragOver"
        @dragleave="onRootDragLeave"
        @drop="onRootDrop"
        :class="[
          'mx-2 mt-1 rounded-md border-2 border-dashed text-center text-xs py-2 transition',
          rootDragOver
            ? 'border-primary-400 bg-primary-50 dark:bg-primary-950 text-primary-600'
            : 'border-transparent text-transparent',
          tagsStore.dragging ? 'border-stone-200 dark:border-stone-700 text-stone-400' : '',
        ]"
      >
        Drop here for top level
      </div>
    </div>
  </div>
</template>
