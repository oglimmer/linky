import { ref, computed } from 'vue'
import type { Link } from '@/types'
import { useLinksStore } from '@/stores/links'

export function useSearch() {
  const searchTerm = ref('')
  const isServerSearch = ref(false)
  const linksStore = useLinksStore()

  const filteredLinks = computed(() => {
    if (!searchTerm.value || isServerSearch.value) {
      return linksStore.sortedLinks
    }
    const term = searchTerm.value.toLowerCase()
    return linksStore.sortedLinks.filter((link: Link) =>
      link.linkUrl.toLowerCase().includes(term) ||
      (link.pageTitle ?? '').toLowerCase().includes(term) ||
      (link.notes ?? '').toLowerCase().includes(term) ||
      (link.rssUrl ?? '').toLowerCase().includes(term) ||
      link.tags.some((t: string) => t.toLowerCase().includes(term)),
    )
  })

  async function submitSearch() {
    if (!searchTerm.value.trim()) {
      clearSearch()
      return
    }
    isServerSearch.value = true
    await linksStore.searchLinks(searchTerm.value)
  }

  function clearSearch() {
    searchTerm.value = ''
    isServerSearch.value = false
    linksStore.fetchLinks(linksStore.selectedTag)
  }

  return { searchTerm, isServerSearch, filteredLinks, submitSearch, clearSearch }
}
