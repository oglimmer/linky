<script setup lang="ts">
import { ref } from 'vue'
import api from '@/api/client'
import { useTagsStore } from '@/stores/tags'
import { useUiStore } from '@/stores/ui'
import { ArrowUpTrayIcon, ArrowDownTrayIcon } from '@heroicons/vue/20/solid'

const tagsStore = useTagsStore()
const ui = useUiStore()

const bookmarks = ref('')
const tagPrefix = ref('')
const importNode = ref('root')
const importing = ref(false)
const exportContent = ref('')

async function handleImport() {
  if (!bookmarks.value.trim()) {
    ui.setError('Paste bookmarks HTML first')
    return
  }
  importing.value = true
  ui.setTemp('Importing bookmarks...')
  try {
    await api.patch('/rest/links/import', {
      bookmarks: bookmarks.value,
      tagPrefix: tagPrefix.value,
      importNode: importNode.value,
    })
    // Poll for completion
    await pollImportReady()
    await tagsStore.fetchHierarchy()
    bookmarks.value = ''
    ui.setInfo('Import complete!')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Import failed'
    ui.setError(msg)
  } finally {
    importing.value = false
  }
}

async function pollImportReady(): Promise<void> {
  return new Promise((resolve) => {
    const check = async () => {
      const { data } = await api.get('/rest/import/ready')
      if (data.importDone) {
        resolve()
      } else {
        setTimeout(check, 2500)
      }
    }
    check()
  })
}

async function handleExport() {
  ui.setTemp('Exporting...')
  try {
    const { data } = await api.get('/rest/export/links')
    exportContent.value = data.content
    ui.setInfo('Export ready — copy the content below')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Export failed'
    ui.setError(msg)
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
    <h1 class="text-xl font-semibold text-stone-800 dark:text-stone-200 font-[--font-display] tracking-tight">Import / Export</h1>

    <!-- Import -->
    <section class="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 space-y-4">
      <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-2">
        <ArrowUpTrayIcon class="w-4 h-4" /> Import Bookmarks
      </h2>
      <p class="text-xs text-stone-500">Paste your bookmarks in Netscape HTML format (exported from any browser).</p>

      <textarea
        v-model="bookmarks"
        rows="8"
        placeholder="Paste bookmarks HTML here..."
        class="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 resize-y font-mono"
      />

      <div class="flex gap-4">
        <div>
          <label class="block text-xs text-stone-500 mb-1">Tag prefix (optional)</label>
          <input v-model="tagPrefix" type="text" placeholder="e.g. imported-"
            class="px-3 py-1.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 w-44" />
        </div>
        <div>
          <label class="block text-xs text-stone-500 mb-1">Root node</label>
          <input v-model="importNode" type="text"
            class="px-3 py-1.5 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 w-44" />
        </div>
      </div>

      <button
        @click="handleImport"
        :disabled="importing"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition shadow-sm shadow-primary-600/20"
      >
        <ArrowUpTrayIcon class="w-4 h-4" />
        {{ importing ? 'Importing...' : 'Import' }}
      </button>
    </section>

    <!-- Export -->
    <section class="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 space-y-4">
      <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300 flex items-center gap-2">
        <ArrowDownTrayIcon class="w-4 h-4" /> Export Bookmarks
      </h2>
      <p class="text-xs text-stone-500">Export all your bookmarks as Netscape HTML format.</p>

      <button
        @click="handleExport"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition shadow-sm shadow-primary-600/20"
      >
        <ArrowDownTrayIcon class="w-4 h-4" />
        Export
      </button>

      <textarea
        v-if="exportContent"
        :value="exportContent"
        readonly
        rows="12"
        class="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 font-mono resize-y"
      />
    </section>
  </div>
</template>
