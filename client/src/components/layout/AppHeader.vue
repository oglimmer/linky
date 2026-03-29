<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import SearchBar from '@/components/common/SearchBar.vue'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'

const auth = useAuthStore()
const mobileOpen = ref(false)

const navLinks = [
  { to: '/links/portal', label: 'Links' },
  { to: '/tags', label: 'Tags' },
  { to: '/help', label: 'Help' },
]
</script>

<template>
  <header class="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6">
      <div class="flex items-center justify-between h-14">
        <!-- Logo -->
        <RouterLink to="/links/portal" class="text-xl font-bold text-primary-600 dark:text-primary-400 shrink-0">
          Linky
        </RouterLink>

        <!-- Desktop nav -->
        <nav class="hidden md:flex items-center gap-1 ml-8">
          <RouterLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            active-class="!text-primary-600 dark:!text-primary-400 !bg-primary-50 dark:!bg-primary-950"
          >
            {{ link.label }}
          </RouterLink>
        </nav>

        <!-- Search + logout (desktop) -->
        <div class="hidden md:flex items-center gap-3 ml-auto">
          <SearchBar />
          <button
            @click="auth.logout()"
            class="px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            Logout
          </button>
        </div>

        <!-- Mobile menu button -->
        <button @click="mobileOpen = !mobileOpen" class="md:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
          <Bars3Icon v-if="!mobileOpen" class="w-5 h-5" />
          <XMarkIcon v-else class="w-5 h-5" />
        </button>
      </div>
    </div>

    <!-- Mobile nav -->
    <div v-if="mobileOpen" class="md:hidden border-t border-gray-200 dark:border-gray-800 px-4 py-3 space-y-2">
      <SearchBar class="mb-3" />
      <RouterLink
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="block px-3 py-2 rounded-md text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        active-class="!text-primary-600 !bg-primary-50"
        @click="mobileOpen = false"
      >
        {{ link.label }}
      </RouterLink>
      <button
        @click="auth.logout()"
        class="block w-full text-left px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
      >
        Logout
      </button>
    </div>
  </header>
</template>
