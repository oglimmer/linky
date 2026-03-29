<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TreeNode } from '@/stores/tags'
import { useTagsStore } from '@/stores/tags'
import { ChevronRightIcon } from '@heroicons/vue/20/solid'

const props = defineProps<{ node: TreeNode; depth?: number }>()
const tagsStore = useTagsStore()

const depth = computed(() => props.depth ?? 0)
const isSelected = computed(() => tagsStore.selectedNode === props.node.name)
const hasChildren = computed(() => props.node.children.length > 0)
const isEmpty = computed(() => props.node.count === 0)

// Drag-and-drop state
type DropZone = 'above' | 'child' | 'below' | null
const dropZone = ref<DropZone>(null)

function select() {
  tagsStore.selectedNode = props.node.name
}

// --- Drag source ---
function onDragStart(e: DragEvent) {
  tagsStore.dragging = props.node.name
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', props.node.name)
}

function onDragEnd() {
  tagsStore.dragging = null
}

// --- Drop target ---
function getZone(e: DragEvent): DropZone {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
  const y = e.clientY - rect.top
  const third = rect.height / 3
  if (y < third) return 'above'
  if (y > third * 2) return 'below'
  return 'child'
}

function isValidDrop(): boolean {
  const dragging = tagsStore.dragging
  if (!dragging) return false
  // Can't drop on itself
  if (dragging === props.node.name) return false
  // Can't drop a parent onto its own descendant
  if (tagsStore.isDescendant(props.node.name, dragging)) return false
  return true
}

function onDragOver(e: DragEvent) {
  if (!isValidDrop()) return
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
  dropZone.value = getZone(e)
}

function onDragLeave() {
  dropZone.value = null
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  const tagName = tagsStore.dragging
  dropZone.value = null
  if (!tagName || !isValidDrop()) return

  const zone = getZone(e)
  const targetTag = tagsStore.flatTags.find(t => t.name === props.node.name)
  if (!targetTag) return

  if (zone === 'child') {
    // Make it a child of this node (last position)
    const children = tagsStore.getChildren(props.node.name)
    tagsStore.moveTag(tagName, props.node.name, children.length)
  } else {
    // Insert as sibling above or below
    const siblings = tagsStore.flatTags
      .filter(t => t.parent === targetTag.parent)
      .sort((a, b) => a.index - b.index)
    const targetIdx = siblings.findIndex(s => s.name === props.node.name)
    const insertAt = zone === 'above' ? targetIdx : targetIdx + 1
    tagsStore.moveTag(tagName, targetTag.parent, insertAt)
  }
  tagsStore.saveHierarchy()
}
</script>

<template>
  <div>
    <div
      draggable="true"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
      @click="select"
      :style="{ paddingLeft: `${depth * 1.25}rem` }"
      :class="[
        'flex items-center gap-2 py-1.5 px-3 cursor-pointer rounded-md text-sm transition select-none relative',
        isSelected
          ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300',
        tagsStore.dragging === node.name ? 'opacity-40' : '',
      ]"
    >
      <!-- Drop indicators -->
      <div v-if="dropZone === 'above'" class="absolute top-0 left-2 right-2 h-0.5 bg-primary-500 rounded-full" />
      <div v-if="dropZone === 'child'" class="absolute inset-0 rounded-md ring-2 ring-primary-500 ring-inset pointer-events-none" />
      <div v-if="dropZone === 'below'" class="absolute bottom-0 left-2 right-2 h-0.5 bg-primary-500 rounded-full" />

      <ChevronRightIcon
        v-if="hasChildren"
        class="w-3.5 h-3.5 text-gray-400 shrink-0"
      />
      <span v-else class="w-3.5 shrink-0" />
      <span :class="[isEmpty ? 'text-gray-400 italic' : '']">{{ node.name }}</span>
      <span class="text-xs text-gray-400 ml-auto">{{ node.count }}</span>
    </div>
    <TagNode
      v-for="child in node.children"
      :key="child.name"
      :node="child"
      :depth="depth + 1"
    />
  </div>
</template>
