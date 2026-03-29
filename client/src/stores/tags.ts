import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import type { TagNode } from '@/types'
import { useUiStore } from './ui'

export interface TreeNode {
  name: string
  count: number
  children: TreeNode[]
}

export const useTagsStore = defineStore('tags', () => {
  const flatTags = ref<TagNode[]>([])
  const tagCount = ref<Record<string, number>>({})
  const selectedNode = ref<string | null>(null)
  const loading = ref(false)
  const dragging = ref<string | null>(null)

  // Build a nested tree from the flat list
  const tree = computed<TreeNode[]>(() => {
    if (!flatTags.value?.length) return []
    const map = new Map<string, TreeNode>()
    for (const t of flatTags.value) {
      map.set(t.name, { name: t.name, count: tagCount.value[t.name] ?? 0, children: [] })
    }
    const roots: TreeNode[] = []
    for (const t of flatTags.value) {
      const node = map.get(t.name)!
      if (t.parent === 'root' || !map.has(t.parent)) {
        roots.push(node)
      } else {
        map.get(t.parent)!.children.push(node)
      }
    }
    // Sort children by index
    const indexMap = new Map<string, number>(flatTags.value.map((t: TagNode) => [t.name, t.index]))
    const sortByIndex = (nodes: TreeNode[]) => {
      nodes.sort((a: TreeNode, b: TreeNode) => (indexMap.get(a.name) ?? 0) - (indexMap.get(b.name) ?? 0))
      nodes.forEach((n: TreeNode) => sortByIndex(n.children))
    }
    sortByIndex(roots)
    return roots
  })

  const allTagNames = computed(() => (flatTags.value ?? []).map((t: TagNode) => t.name))

  function getParent(tagName: string): string | null {
    if (!flatTags.value?.length) return null
    const tag = flatTags.value.find((t: TagNode) => t.name === tagName)
    return tag && tag.parent !== 'root' ? tag.parent : null
  }

  function getChildren(tagName: string): TagNode[] {
    if (!flatTags.value?.length) return []
    return flatTags.value
      .filter((t: TagNode) => t.parent === tagName)
      .sort((a: TagNode, b: TagNode) => a.index - b.index)
  }

  function getSiblings(tagName: string): TagNode[] {
    if (!flatTags.value?.length) return []
    const tag = flatTags.value.find((t: TagNode) => t.name === tagName)
    if (!tag) return []
    return flatTags.value
      .filter((t: TagNode) => t.parent === tag.parent && t.name !== tagName)
      .sort((a: TagNode, b: TagNode) => a.index - b.index)
  }

  async function fetchHierarchy() {
    loading.value = true
    try {
      const { data } = await api.get('/rest/tags/hierarchy')
      // Server returns flat array with count on each node: [{ name, parent, index, count }, ...]
      flatTags.value = data
        .filter((t: any) => t.name !== 'root')
        .map((t: any) => ({ name: t.name, parent: t.parent, index: t.index }))
      tagCount.value = Object.fromEntries(
        data.filter((t: any) => t.name !== 'root').map((t: any) => [t.name, t.count ?? 0])
      )
    } finally {
      loading.value = false
    }
  }

  async function saveHierarchy() {
    const ui = useUiStore()
    ui.setTemp('Saving tag hierarchy...')
    await api.put('/rest/tags/hierarchy', { tree: flatTags.value })
    ui.setInfo('Tag hierarchy saved')
  }

  async function addTag(name: string, parent: string) {
    const siblings = flatTags.value.filter((t: TagNode) => t.parent === parent)
    const maxIndex = siblings.length > 0 ? Math.max(...siblings.map((s: TagNode) => s.index)) : -1
    flatTags.value.push({ name, parent, index: maxIndex + 1 })
    tagCount.value[name] = 0
    await saveHierarchy()
  }

  async function removeTag(name: string) {
    const ui = useUiStore()
    const children = flatTags.value.filter((t: TagNode) => t.parent === name)
    if (children.length > 0) {
      ui.setError('Cannot delete tag with children. Remove children first.')
      return
    }
    await api.delete(`/rest/tags/${encodeURIComponent(name)}`)
    flatTags.value = flatTags.value.filter((t: TagNode) => t.name !== name)
    delete tagCount.value[name]
    if (selectedNode.value === name) selectedNode.value = null
  }

  async function renameTag(oldName: string, newName: string) {
    const ui = useUiStore()
    ui.setTemp('Renaming tag...')
    await api.patch('/rest/links/tags', { oldTagName: oldName, newTagName: newName })
    // Update in flat list
    for (const t of flatTags.value) {
      if (t.name === oldName) t.name = newName
      if (t.parent === oldName) t.parent = newName
    }
    if (tagCount.value[oldName] !== undefined) {
      tagCount.value[newName] = (tagCount.value[newName] ?? 0) + (tagCount.value[oldName] ?? 0)
      delete tagCount.value[oldName]
    }
    if (selectedNode.value === oldName) selectedNode.value = newName
    ui.setInfo(`Renamed "${oldName}" to "${newName}"`)
  }

  function moveTag(tagName: string, newParent: string, newIndex: number) {
    const tag = flatTags.value.find((t: TagNode) => t.name === tagName)
    if (!tag) return
    // Remove from old parent's index sequence
    const oldSiblings = flatTags.value
      .filter((t: TagNode) => t.parent === tag.parent && t.name !== tagName)
      .sort((a: TagNode, b: TagNode) => a.index - b.index)
    oldSiblings.forEach((s: TagNode, i: number) => (s.index = i))

    tag.parent = newParent

    // Insert at new index
    const newSiblings = flatTags.value
      .filter((t: TagNode) => t.parent === newParent && t.name !== tagName)
      .sort((a: TagNode, b: TagNode) => a.index - b.index)
    newSiblings.splice(newIndex, 0, tag)
    newSiblings.forEach((s: TagNode, i: number) => (s.index = i))
  }

  function isDescendant(tagName: string, potentialAncestor: string): boolean {
    let current = tagName
    while (current && current !== 'root') {
      const tag = flatTags.value.find((t: TagNode) => t.name === current)
      if (!tag) return false
      if (tag.parent === potentialAncestor) return true
      current = tag.parent
    }
    return false
  }

  function adjustCount(tagName: string, delta: number) {
    tagCount.value[tagName] = (tagCount.value[tagName] ?? 0) + delta
  }

  return {
    flatTags, tagCount, selectedNode, loading, tree, allTagNames, dragging,
    getParent, getChildren, getSiblings, isDescendant,
    fetchHierarchy, saveHierarchy, addTag, removeTag, renameTag, moveTag, adjustCount,
  }
})
