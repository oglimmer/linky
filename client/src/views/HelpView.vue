<script setup lang="ts">
const systemTags = [
  { name: 'all', desc: 'Contains all links' },
  { name: 'archive', desc: 'Archived links' },
  { name: 'duedate', desc: 'Links with date tags (YYYY-MM-DD)' },
  { name: 'locked', desc: 'Links excluded from link checking' },
  { name: 'rss', desc: 'Links with an RSS feed' },
  { name: 'untagged', desc: 'Links with no custom tags' },
]

const searchHelp = [
  { syntax: 'keyword', desc: 'Full-text search across all fields' },
]
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-8">
    <h1 class="text-xl font-semibold text-gray-800 dark:text-gray-200">Help</h1>

    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">System Tags</h2>
      <p class="text-xs text-gray-500">These tags are managed automatically and cannot be modified directly.</p>
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
        <div v-for="tag in systemTags" :key="tag.name" class="flex items-baseline gap-4 px-4 py-2.5 text-sm">
          <code class="font-mono text-primary-600 dark:text-primary-400 shrink-0 w-24">{{ tag.name }}</code>
          <span class="text-gray-600 dark:text-gray-400">{{ tag.desc }}</span>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Search Syntax</h2>
      <p class="text-xs text-gray-500">Type to filter locally. Press Enter to run a full-text server search.</p>
      <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm divide-y divide-gray-100 dark:divide-gray-800">
        <div v-for="item in searchHelp" :key="item.syntax" class="flex items-baseline gap-4 px-4 py-2.5 text-sm">
          <code class="font-mono text-primary-600 dark:text-primary-400 shrink-0 w-32">{{ item.syntax }}</code>
          <span class="text-gray-600 dark:text-gray-400">{{ item.desc }}</span>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Account</h2>
      <div class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
        <p>Your data is stored securely. You can delete your account and all associated data from the settings.</p>
      </div>
    </section>
  </div>
</template>
