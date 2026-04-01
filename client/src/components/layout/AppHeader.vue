<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SearchBar from '@/components/common/SearchBar.vue'
import { Bars3Icon, XMarkIcon, Squares2X2Icon } from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const mobileOpen = ref(false)
const appsOpen = ref(false)
const appsDropdown = ref<HTMLElement | null>(null)

const navLinks = [
  { to: '/links/portal', label: 'Links' },
  { to: '/tags', label: 'Tags' },
  { to: '/help', label: 'Help' },
]

const portfolioApps = [
  { href: 'https://content.oglimmer.com/', label: 'Content', description: 'Content archive' },
  { href: 'https://infographics.oglimmer.com/', label: 'Infographics', description: 'Data visualizations' },
  { href: 'https://news.oglimmer.com/', label: 'News', description: 'News aggregator' },
]

function handleClickOutside(e: MouseEvent) {
  if (appsDropdown.value && !appsDropdown.value.contains(e.target as Node)) {
    appsOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<template>
  <header class="bg-white/80 dark:bg-stone-900/80 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-14">
        <!-- Logo -->
        <RouterLink to="/links/portal" class="font-[--font-display] text-xl font-semibold text-primary-700 dark:text-primary-400 shrink-0 tracking-tight">
          Linky
        </RouterLink>

        <!-- Desktop nav -->
        <nav class="hidden md:flex items-center gap-0.5 ml-8">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-3 py-1.5 rounded-md text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            active-class="!text-primary-700 dark:!text-primary-400 !bg-primary-50 dark:!bg-primary-950"
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <!-- Search + apps + logout (desktop) -->
        <div class="hidden md:flex items-center gap-3 ml-auto">
          <SearchBar />

          <!-- Apps dropdown -->
          <div ref="appsDropdown" class="relative">
            <button
              @click="appsOpen = !appsOpen"
              class="p-1.5 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Other apps"
            >
              <Squares2X2Icon class="w-5 h-5" />
            </button>
            <Transition
              enter-active-class="transition ease-out duration-100"
              enter-from-class="opacity-0 scale-95"
              enter-to-class="opacity-100 scale-100"
              leave-active-class="transition ease-in duration-75"
              leave-from-class="opacity-100 scale-100"
              leave-to-class="opacity-0 scale-95"
            >
              <div
                v-if="appsOpen"
                class="absolute right-0 mt-2 w-56 origin-top-right rounded-lg bg-white dark:bg-stone-800 shadow-lg ring-1 ring-stone-200 dark:ring-stone-700 p-2 space-y-1"
              >
                <a
                  v-for="app in portfolioApps"
                  :key="app.href"
                  :href="app.href"
                  target="_blank"
                  rel="noopener"
                  class="flex flex-col px-3 py-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
                  @click="appsOpen = false"
                >
                  <span class="text-sm font-medium text-stone-700 dark:text-stone-200">{{ app.label }}</span>
                  <span class="text-xs text-stone-400 dark:text-stone-500">{{ app.description }}</span>
                </a>
              </div>
            </Transition>
          </div>

          <button
            @click="auth.logout()"
            class="px-3 py-1.5 rounded-md text-sm font-medium text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Logout
          </button>
        </div>

        <!-- Mobile menu button -->
        <button @click="mobileOpen = !mobileOpen" class="md:hidden p-2 rounded-md text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
          <Bars3Icon v-if="!mobileOpen" class="w-5 h-5" />
          <XMarkIcon v-else class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Mobile nav -->
    <div v-if="mobileOpen" class="md:hidden border-t border-stone-200 dark:border-stone-800 px-4 py-3 space-y-2">
      <SearchBar class="mb-3" />
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="block px-3 py-2 rounded-md text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
        active-class="!text-primary-700 !bg-primary-50"
        @click="mobileOpen = false"
      >
        {{ link.label }}
      </RouterLink>
      <!-- Other apps (mobile) -->
      <div class="border-t border-stone-200 dark:border-stone-700 pt-2 mt-2">
        <span class="block px-3 py-1 text-xs font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Other Apps</span>
        <a
          v-for="app in portfolioApps"
          :key="app.href"
          :href="app.href"
          target="_blank"
          rel="noopener"
          class="block px-3 py-2 rounded-md text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
          @click="mobileOpen = false"
        >
          {{ app.label }}
        </a>
      </div>

      <button
        @click="auth.logout()"
        class="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Logout
      </button>
    </div>
  </header>
</template>
