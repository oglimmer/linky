<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useLinksStore } from '@/stores/links'
import { XMarkIcon, ArrowTopRightOnSquareIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from '@heroicons/vue/20/solid'

const FONT_SIZE_KEY = 'rss-panel-font-size'
const FONT_SIZE_MIN = 12
const FONT_SIZE_MAX = 22
const FONT_SIZE_STEP = 1
const FONT_SIZE_DEFAULT = 14

const linksStore = useLinksStore()

const isOpen = computed(() => linksStore.expandedRssId !== null)
const linkId = computed(() => linksStore.expandedRssId)
const items = computed(() => linkId.value !== null ? (linksStore.rssDetails[linkId.value] ?? []) : [])
const sourceLink = computed(() => linkId.value !== null ? linksStore.links.find(l => l.id === linkId.value) : null)

const fontSize = ref(FONT_SIZE_DEFAULT)

function loadFontSize() {
  const stored = localStorage.getItem(FONT_SIZE_KEY)
  if (stored) {
    const n = parseInt(stored, 10)
    if (n >= FONT_SIZE_MIN && n <= FONT_SIZE_MAX) fontSize.value = n
  }
}

function saveFontSize(n: number) {
  fontSize.value = n
  localStorage.setItem(FONT_SIZE_KEY, String(n))
}

function increase() {
  if (fontSize.value < FONT_SIZE_MAX) saveFontSize(fontSize.value + FONT_SIZE_STEP)
}

function decrease() {
  if (fontSize.value > FONT_SIZE_MIN) saveFontSize(fontSize.value - FONT_SIZE_STEP)
}

function stripHtml(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html
  return div.textContent ?? div.innerText ?? ''
}

function openItem(i: number) {
  const url = items.value[i]?.link
  if (url) window.open(url, '_blank', 'noopener')
  linksStore.dismissRssItem(linkId.value!, i)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') linksStore.closeRssPanel()
}

onMounted(() => {
  loadFontSize()
  document.addEventListener('keydown', onKeydown)
})
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/40 dark:bg-black/60 z-40"
        @click="linksStore.closeRssPanel()"
      />
    </Transition>

    <!-- Panel -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-250 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
      <div
        v-if="isOpen"
        class="fixed inset-y-0 right-0 w-full sm:w-[540px] bg-white dark:bg-stone-900 shadow-2xl z-50 flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        <!-- Header -->
        <div class="flex items-start justify-between px-6 py-5 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <div class="min-w-0 mr-4">
            <h2 class="text-lg font-semibold text-stone-800 dark:text-stone-100">RSS Updates</h2>
            <p v-if="sourceLink" class="text-sm text-stone-500 dark:text-stone-400 truncate mt-0.5">
              {{ sourceLink.pageTitle || sourceLink.linkUrl }}
            </p>
            <p class="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
              {{ items.length }} new item{{ items.length !== 1 ? 's' : '' }}
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0 ml-4">
            <button
              @click="decrease"
              :disabled="fontSize <= FONT_SIZE_MIN"
              class="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease font size"
            >
              <MagnifyingGlassMinusIcon class="w-5 h-5" />
            </button>
            <button
              @click="increase"
              :disabled="fontSize >= FONT_SIZE_MAX"
              class="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase font size"
            >
              <MagnifyingGlassPlusIcon class="w-5 h-5" />
            </button>
            <button
              @click="linksStore.closeRssPanel()"
              class="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition ml-1"
              aria-label="Close panel"
            >
              <XMarkIcon class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Item list -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4" :style="{ fontSize: `${fontSize}px` }">
          <div
            v-for="(item, i) in items"
            :key="item.link"
            class="rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/50 p-5"
          >
            <h3 class="font-semibold text-stone-800 dark:text-stone-100 leading-snug mb-3" :style="{ fontSize: `${fontSize + 2}px` }">
              {{ item.title }}
            </h3>
            <p
              v-if="item.description"
              class="text-stone-600 dark:text-stone-400 leading-relaxed mb-4"
            >
              {{ stripHtml(item.description) }}
            </p>
            <div class="flex items-center justify-between pt-1">
              <a
                :href="item.link"
                target="_blank"
                rel="noopener"
                @click="openItem(i)"
                class="inline-flex items-center gap-1.5 font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition"
              >
                Read article
                <ArrowTopRightOnSquareIcon class="w-4 h-4" />
              </a>
              <button
                @click="linksStore.dismissRssItem(linkId!, i)"
                class="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300 transition"
              >
                Dismiss
              </button>
            </div>
          </div>

          <div v-if="items.length === 0" class="flex flex-col items-center justify-center py-16 text-stone-400 dark:text-stone-500">
            <p class="font-medium">All caught up</p>
            <p class="mt-1 text-sm">No new items to show.</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
