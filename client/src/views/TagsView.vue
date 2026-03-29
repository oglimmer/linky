<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useTagsStore } from '@/stores/tags'
import { useUiStore } from '@/stores/ui'
import TagTree from '@/components/tags/TagTree.vue'
import { PlusIcon, TrashIcon, PencilIcon, ArrowUpIcon, ArrowDownIcon, ArrowUturnLeftIcon } from '@heroicons/vue/20/solid'

const tagsStore = useTagsStore()
const ui = useUiStore()

const newTagName = ref('')
const renameInput = ref('')
const showRenameDialog = ref(false)

onMounted(() => {
  if (!tagsStore.flatTags?.length) {
    tagsStore.fetchHierarchy()
  }
})

async function addTag() {
  const name = newTagName.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!name) {
    ui.setError('Tag name must be alphanumeric with hyphens only')
    return
  }
  if (tagsStore.allTagNames?.includes(name)) {
    ui.setError('Tag already exists')
    return
  }
  const parent = tagsStore.selectedNode ?? 'root'
  await tagsStore.addTag(name, parent)
  newTagName.value = ''
}

async function removeTag() {
  if (!tagsStore.selectedNode) return
  await tagsStore.removeTag(tagsStore.selectedNode)
}

function startRename() {
  if (!tagsStore.selectedNode) return
  renameInput.value = tagsStore.selectedNode
  showRenameDialog.value = true
}

async function confirmRename() {
  const newName = renameInput.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')
  if (!newName || newName === tagsStore.selectedNode) {
    showRenameDialog.value = false
    return
  }
  await tagsStore.renameTag(tagsStore.selectedNode!, newName)
  showRenameDialog.value = false
}

async function moveUp() {
  const name = tagsStore.selectedNode
  if (!name) return
  const tag = tagsStore.flatTags.find(t => t.name === name)
  if (!tag || tag.index <= 0) return
  tagsStore.moveTag(name, tag.parent, tag.index - 1)
  await tagsStore.saveHierarchy()
}

async function moveDown() {
  const name = tagsStore.selectedNode
  if (!name) return
  const tag = tagsStore.flatTags.find(t => t.name === name)
  if (!tag) return
  const siblings = tagsStore.flatTags.filter(t => t.parent === tag.parent)
  if (tag.index >= siblings.length - 1) return
  tagsStore.moveTag(name, tag.parent, tag.index + 1)
  await tagsStore.saveHierarchy()
}

async function unindent() {
  const name = tagsStore.selectedNode
  if (!name) return
  const tag = tagsStore.flatTags.find(t => t.name === name)
  if (!tag || tag.parent === 'root') return
  const parentTag = tagsStore.flatTags.find(t => t.name === tag.parent)
  if (!parentTag) return
  // Move to grandparent, right after the current parent
  tagsStore.moveTag(name, parentTag.parent, parentTag.index + 1)
  await tagsStore.saveHierarchy()
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6">
    <h1 class="font-[--font-display] text-xl font-semibold text-stone-800 dark:text-stone-200 mb-4 tracking-tight">Tag Manager</h1>

    <!-- Actions toolbar -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <div class="flex items-center gap-2">
        <input
          v-model="newTagName"
          @keydown.enter="addTag"
          type="text"
          placeholder="New tag name..."
          class="px-3 py-1.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 w-48 transition"
        />
        <button
          @click="addTag"
          class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition shadow-sm shadow-primary-600/20"
        >
          <PlusIcon class="w-4 h-4" />
          Add
        </button>
      </div>

      <div class="flex items-center gap-2 ml-auto">
        <button
          @click="moveUp"
          :disabled="!tagsStore.selectedNode"
          title="Move up"
          class="inline-flex items-center p-1.5 rounded-lg text-sm border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition"
        >
          <ArrowUpIcon class="w-4 h-4" />
        </button>
        <button
          @click="moveDown"
          :disabled="!tagsStore.selectedNode"
          title="Move down"
          class="inline-flex items-center p-1.5 rounded-lg text-sm border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition"
        >
          <ArrowDownIcon class="w-4 h-4" />
        </button>
        <button
          @click="unindent"
          :disabled="!tagsStore.selectedNode"
          title="Move to parent level"
          class="inline-flex items-center p-1.5 rounded-lg text-sm border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition"
        >
          <ArrowUturnLeftIcon class="w-4 h-4" />
        </button>
        <button
          @click="startRename"
          :disabled="!tagsStore.selectedNode"
          class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 transition"
        >
          <PencilIcon class="w-4 h-4" />
          Rename
        </button>
        <button
          @click="removeTag"
          :disabled="!tagsStore.selectedNode"
          class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-red-600 border border-red-300 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950 disabled:opacity-40 transition"
        >
          <TrashIcon class="w-4 h-4" />
          Delete
        </button>
      </div>
    </div>

    <p v-if="tagsStore.selectedNode" class="text-sm text-stone-500 mb-3">
      Selected: <span class="font-medium text-stone-700 dark:text-stone-300">{{ tagsStore.selectedNode }}</span>
      &mdash; new tags will be added as children. Drag tags to reorganize.
    </p>
    <p v-else class="text-sm text-stone-500 mb-3">
      Drag tags to reorganize the hierarchy, or select a tag to add children.
    </p>

    <TagTree />

    <!-- Rename dialog -->
    <Teleport to="body">
      <div v-if="showRenameDialog" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div class="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 border border-stone-200 dark:border-stone-800 animate-fade-in-up">
          <h3 class="text-sm font-semibold text-stone-700 dark:text-stone-300 mb-3">Rename tag</h3>
          <input
            v-model="renameInput"
            @keydown.enter="confirmRename"
            type="text"
            autofocus
            class="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 mb-4 transition"
          />
          <div class="flex gap-2 justify-end">
            <button @click="showRenameDialog = false" class="px-4 py-2 text-sm rounded-lg text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800 transition">Cancel</button>
            <button @click="confirmRename" class="px-4 py-2 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition shadow-sm shadow-primary-600/20">Rename</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
