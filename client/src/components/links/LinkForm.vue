<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue'
import { useLinksStore } from '@/stores/links'
import { useTagsStore } from '@/stores/tags'
import { useUiStore } from '@/stores/ui'
import { XMarkIcon } from '@heroicons/vue/20/solid'

const linksStore = useLinksStore()
const tagsStore = useTagsStore()
const ui = useUiStore()

const initialTag = linksStore.selectedTag !== 'all' ? linksStore.selectedTag : ''
const url = ref('')
const rssUrl = ref('')
const pageTitle = ref('')
const notes = ref('')
const submitting = ref(false)

// Tag chip state
const tagList = ref<string[]>(initialTag ? [initialTag] : [])
const tagInput = ref('')
const showSuggestions = ref(false)
const tagInputEl = ref<HTMLInputElement | null>(null)
const selectedSuggestionIndex = ref(-1)

const isEditing = computed(() => !!linksStore.editingLink)

const tagsString = computed(() => tagList.value.join(' '))

const tagSuggestions = computed(() => {
  if (!tagInput.value) return []
  const term = tagInput.value.toLowerCase()
  return tagsStore.allTagNames
    .filter((t: string) => t.includes(term) && !tagList.value.includes(t))
    .slice(0, 8)
})

watch(() => linksStore.editingLink, (link) => {
  if (link) {
    url.value = link.linkUrl
    tagList.value = [...link.tags]
    rssUrl.value = link.rssUrl ?? ''
    pageTitle.value = link.pageTitle ?? ''
    notes.value = link.notes ?? ''
  }
}, { immediate: true })

function focusInput() {
  tagInputEl.value?.focus()
}

function addTag(tag: string) {
  const normalized = tag.trim().toLowerCase()
  if (normalized && !tagList.value.includes(normalized)) {
    tagList.value.push(normalized)
  }
  tagInput.value = ''
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
  nextTick(() => tagInputEl.value?.focus())
}

function removeTag(index: number) {
  tagList.value.splice(index, 1)
  nextTick(() => tagInputEl.value?.focus())
}

function onTagInputKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (tagSuggestions.value.length > 0) {
      selectedSuggestionIndex.value = Math.min(selectedSuggestionIndex.value + 1, tagSuggestions.value.length - 1)
    }
    return
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, -1)
    return
  }
  if (e.key === 'Escape') {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
    return
  }
  if (e.key === ' ' || e.key === 'Enter' || e.key === 'Tab') {
    if (selectedSuggestionIndex.value >= 0 && tagSuggestions.value.length > 0) {
      e.preventDefault()
      addTag(tagSuggestions.value[selectedSuggestionIndex.value])
    } else if (tagInput.value.trim()) {
      e.preventDefault()
      addTag(tagInput.value)
    }
    return
  }
  if (e.key === 'Backspace' && !tagInput.value && tagList.value.length > 0) {
    tagList.value.pop()
    return
  }
}

function onTagInputInput() {
  showSuggestions.value = !!tagInput.value
  selectedSuggestionIndex.value = -1
}

function hideSuggestionsDelayed() {
  setTimeout(() => {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }, 200)
}

async function handleSubmit() {
  if (!url.value.trim()) {
    ui.setError('URL is required')
    return
  }
  submitting.value = true
  try {
    const payload = {
      url: url.value,
      tags: tagsString.value,
      rssUrl: rssUrl.value || undefined,
      pageTitle: pageTitle.value || undefined,
      notes: notes.value || undefined,
    }
    if (isEditing.value) {
      await linksStore.updateLink(linksStore.editingLink!.id, payload)
    } else {
      await linksStore.createLink(payload)
    }
    resetForm()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to save link'
    ui.setError(msg)
  } finally {
    submitting.value = false
  }
}

async function handleDelete() {
  if (!isEditing.value) return
  submitting.value = true
  try {
    await linksStore.deleteLink(linksStore.editingLink!.id)
    resetForm()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to delete link'
    ui.setError(msg)
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  url.value = ''
  const tag = linksStore.selectedTag !== 'all' ? linksStore.selectedTag : ''
  tagList.value = tag ? [tag] : []
  tagInput.value = ''
  rssUrl.value = ''
  pageTitle.value = ''
  notes.value = ''
  linksStore.stopEditing()
}

function cancel() {
  resetForm()
  linksStore.showForm = false
}
</script>

<template>
  <div class="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 p-5 shadow-sm animate-fade-in-up">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-stone-700 dark:text-stone-300">
        {{ isEditing ? 'Edit Link' : 'Add Link' }}
      </h3>
      <button @click="cancel" class="text-stone-400 hover:text-stone-600 transition"><XMarkIcon class="w-5 h-5" /></button>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-3">
      <input v-model="url" type="url" placeholder="URL" required
        class="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition" />

      <!-- Tag chips input -->
      <div class="relative">
        <div
          @click="focusInput"
          class="flex flex-wrap items-center gap-1.5 min-h-[38px] px-2.5 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 cursor-text focus-within:ring-2 focus-within:ring-primary-500/40 focus-within:border-primary-400 transition"
        >
          <span
            v-for="(tag, i) in tagList"
            :key="tag"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 text-xs font-medium"
          >
            {{ tag }}
            <button
              type="button"
              @click.stop="removeTag(i)"
              class="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-primary-200 dark:hover:bg-primary-800 transition"
            >
              <XMarkIcon class="w-3 h-3" />
            </button>
          </span>
          <input
            ref="tagInputEl"
            v-model="tagInput"
            @input="onTagInputInput"
            @keydown="onTagInputKeydown"
            @focus="showSuggestions = !!tagInput"
            @blur="hideSuggestionsDelayed"
            type="text"
            :placeholder="tagList.length === 0 ? 'Add tags...' : ''"
            class="flex-1 min-w-[80px] bg-transparent border-none outline-none text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 p-0.5"
          />
        </div>

        <!-- Suggestions dropdown -->
        <div
          v-if="showSuggestions && tagSuggestions.length"
          class="absolute z-10 w-full mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg max-h-40 overflow-y-auto"
        >
          <button
            v-for="(s, i) in tagSuggestions"
            :key="s"
            type="button"
            @mousedown.prevent="addTag(s)"
            :class="[
              'block w-full text-left px-3 py-1.5 text-sm transition',
              i === selectedSuggestionIndex
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200'
                : 'hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300'
            ]"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <input v-model="pageTitle" type="text" placeholder="Page title (optional)"
        class="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition" />

      <input v-model="rssUrl" type="url" placeholder="RSS URL (optional)"
        class="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition" />

      <textarea v-model="notes" placeholder="Notes (optional)" rows="2"
        class="w-full px-3.5 py-2 text-sm rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition resize-y" />

      <div class="flex gap-2 pt-1">
        <button type="submit" :disabled="submitting"
          class="flex-1 py-2 rounded-xl bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50 transition shadow-sm shadow-primary-600/20">
          {{ isEditing ? 'Update' : 'Add' }}
        </button>
        <button v-if="isEditing" type="button" @click="handleDelete" :disabled="submitting"
          class="py-2 px-4 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition">
          Delete
        </button>
      </div>
    </form>
  </div>
</template>
