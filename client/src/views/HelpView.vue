<script setup lang="ts">
const systemTags = [
  { name: 'all', desc: 'Contains all links' },
  { name: 'archive', desc: 'Archived links' },

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
    <h1 class="text-xl font-semibold text-stone-800 dark:text-stone-200 font-[--font-display] tracking-tight">Help</h1>

    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300">System Tags</h2>
      <p class="text-xs text-stone-500">These tags are managed automatically and cannot be modified directly.</p>
      <div class="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm divide-y divide-stone-100 dark:divide-stone-800">
        <div v-for="tag in systemTags" :key="tag.name" class="flex items-baseline gap-4 px-4 py-2.5 text-sm">
          <code class="font-mono text-primary-600 dark:text-primary-400 shrink-0 w-24">{{ tag.name }}</code>
          <span class="text-stone-600 dark:text-stone-400">{{ tag.desc }}</span>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300">Search Syntax</h2>
      <p class="text-xs text-stone-500">Type to filter locally. Press Enter to run a full-text server search.</p>
      <div class="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm divide-y divide-stone-100 dark:divide-stone-800">
        <div v-for="item in searchHelp" :key="item.syntax" class="flex items-baseline gap-4 px-4 py-2.5 text-sm">
          <code class="font-mono text-primary-600 dark:text-primary-400 shrink-0 w-32">{{ item.syntax }}</code>
          <span class="text-stone-600 dark:text-stone-400">{{ item.desc }}</span>
        </div>
      </div>
    </section>

    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300">Account</h2>
      <div class="text-sm text-stone-600 dark:text-stone-400 space-y-2">
        <p>Your data is stored securely. You can delete your account and all associated data from the settings.</p>
      </div>
    </section>
  </div>
</template>
