import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import type { Link, LinkPayload, SortColumn, SortOrder, LinkColumn } from '@/types'
import { useUiStore } from './ui'
import { useTagsStore } from './tags'

export const useLinksStore = defineStore('links', () => {
  const links = ref<Link[]>([])
  const selectedTag = ref('portal')
  const sortColumn = ref<SortColumn>('mostUsed')
  const sortOrder = ref<SortOrder>(-1)
  const visibleColumns = ref<LinkColumn[]>(['pageTitle', 'linkUrl'])
  const loading = ref(false)
  const editingLink = ref<Link | null>(null)
  const showForm = ref(false)

  // RSS state
  const rssUpdates = ref<Record<string, number>>({})
  const rssDetails = ref<Record<string, { link: string; title: string }[]>>({})
  const expandedRssId = ref<number | null>(null)

  const sortedLinks = computed(() => {
    const list = [...links.value]
    list.sort((a, b) => {
      let cmp = 0
      switch (sortColumn.value) {
        case 'mostUsed':
          cmp = a.callCounter - b.callCounter
          break
        case 'lastUsed':
          cmp = (a.lastCalled ?? '').localeCompare(b.lastCalled ?? '')
          break
        case 'lastAdded':
          cmp = (a.createdDate ?? '').localeCompare(b.createdDate ?? '')
          break
        case 'title':
          cmp = (a.pageTitle ?? '').localeCompare(b.pageTitle ?? '')
          break
        case 'url':
          cmp = a.linkUrl.localeCompare(b.linkUrl)
          break
      }
      return cmp * sortOrder.value
    })
    return list
  })

  function setSort(column: SortColumn) {
    if (sortColumn.value === column) {
      sortOrder.value = (sortOrder.value === 1 ? -1 : 1) as SortOrder
    } else {
      sortColumn.value = column
      sortOrder.value = -1
    }
  }

  function toggleColumn(col: LinkColumn) {
    const idx = visibleColumns.value.indexOf(col)
    if (idx >= 0) {
      visibleColumns.value.splice(idx, 1)
    } else {
      visibleColumns.value.push(col)
    }
  }

  async function fetchLinks(tag: string) {
    loading.value = true
    selectedTag.value = tag
    try {
      const { data } = await api.get(`/rest/links/${encodeURIComponent(tag)}`)
      links.value = data
    } finally {
      loading.value = false
    }
  }

  async function createLink(payload: LinkPayload) {
    const ui = useUiStore()
    const tags = useTagsStore()
    ui.setTemp('Saving...')
    const { data } = await api.post('/rest/links', payload)
    const newLink: Link = data.primary
    // Add to list if it belongs to current tag
    if (newLink.tags.includes(selectedTag.value) || selectedTag.value === 'all') {
      links.value.push(newLink)
    }
    for (const t of newLink.tags as string[]) {
      tags.adjustCount(t, 1)
    }
    ui.setInfo('Link created')
    return data
  }

  async function updateLink(id: number, payload: LinkPayload) {
    const ui = useUiStore()
    const tags = useTagsStore()
    ui.setTemp('Updating...')
    const { data } = await api.put(`/rest/links/${id}`, payload)
    const updated: Link = data.primary
    const idx = links.value.findIndex((l: Link) => l.id === id)
    const oldTags = idx >= 0 ? links.value[idx].tags : [] as string[]
    if (idx >= 0) {
      links.value[idx] = updated
    }
    for (const t of oldTags as string[]) {
      if (!updated.tags.includes(t)) tags.adjustCount(t, -1)
    }
    for (const t of updated.tags as string[]) {
      if (!oldTags.includes(t)) tags.adjustCount(t, 1)
    }
    if (!updated.tags.includes(selectedTag.value) && selectedTag.value !== 'all') {
      links.value = links.value.filter((l: Link) => l.id !== id)
    }
    ui.setInfo('Link updated')
    return data
  }

  async function deleteLink(id: number) {
    const ui = useUiStore()
    const tags = useTagsStore()
    ui.setTemp('Deleting...')
    const link = links.value.find((l: Link) => l.id === id)
    await api.delete(`/rest/links/${id}`)
    links.value = links.value.filter((l: Link) => l.id !== id)
    if (link) {
      for (const t of link.tags) {
        tags.adjustCount(t, -1)
      }
    }
    ui.setInfo('Link deleted')
  }

  async function clickLink(id: number) {
    const link = links.value.find((l: Link) => l.id === id)
    if (link) {
      link.callCounter++
      link.lastCalled = new Date().toISOString()
    }
    // The /leave endpoint handles the actual redirect and counter increment server-side
  }

  async function searchLinks(query: string) {
    loading.value = true
    try {
      const { data } = await api.get('/rest/search/links', { params: { q: query } })
      links.value = data
    } finally {
      loading.value = false
    }
  }

  function startEditing(link: Link) {
    editingLink.value = { ...link }
    showForm.value = true
  }

  function stopEditing() {
    editingLink.value = null
    showForm.value = false
  }

  // RSS
  async function fetchRssCount(linkId: number) {
    try {
      const { data } = await api.get(`/rest/links/${linkId}/rss`)
      if (data.result > 0) {
        rssUpdates.value[linkId] = data.result
      }
    } catch {
      // ignore RSS errors
    }
  }

  async function fetchRssDetails(linkId: number) {
    const { data } = await api.get(`/rest/links/${linkId}/rssDetails`)
    rssDetails.value[linkId] = data.display
    expandedRssId.value = expandedRssId.value === linkId ? null : linkId
  }

  async function fetchAllRssUpdates() {
    const rssLinks = links.value.filter((l: Link) => l.rssUrl)
    await Promise.all(rssLinks.map((l: Link) => fetchRssCount(l.id)))
  }

  return {
    links, selectedTag, sortColumn, sortOrder, visibleColumns, loading,
    editingLink, showForm, rssUpdates, rssDetails, expandedRssId,
    sortedLinks,
    setSort, toggleColumn, fetchLinks, createLink, updateLink, deleteLink,
    clickLink, searchLinks,
    startEditing, stopEditing,
    fetchRssCount, fetchRssDetails, fetchAllRssUpdates,
  }
})
