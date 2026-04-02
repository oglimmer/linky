<script setup lang="ts">
function ssoLogin() {
  window.location.href = '/auth/oidc'
}
</script>

<template>
  <div class="flex-1 flex items-center justify-center px-4 relative grain overflow-hidden">
    <!-- Decorative background elements -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-200/30 dark:bg-primary-900/20 blur-3xl"></div>
      <div class="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-amber-100/40 dark:bg-amber-900/10 blur-3xl"></div>
      <div class="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-orange-100/20 dark:bg-orange-900/10 blur-3xl"></div>
    </div>

    <div class="w-full max-w-md relative z-10 animate-fade-in-up">
      <!-- Logo -->
      <div class="text-center mb-10">
        <h1 class="font-[--font-display] text-5xl font-semibold text-primary-800 dark:text-primary-300 tracking-tight">Linky</h1>
        <p class="mt-3 text-stone-500 dark:text-stone-400 text-sm">Your personal bookmark collection</p>
      </div>

      <div class="bg-white dark:bg-stone-900 rounded-2xl shadow-xl shadow-stone-200/50 dark:shadow-stone-900/50 p-8 space-y-6 border border-stone-200/60 dark:border-stone-800/60">
        <!-- Introduction -->
        <div class="text-center space-y-3">
          <p class="text-stone-600 dark:text-stone-300 text-sm leading-relaxed">
            Save, tag, and search your bookmarks. Track RSS feeds and keep your reading organized in one place.
          </p>
          <ul class="text-stone-500 dark:text-stone-400 text-xs space-y-1.5">
            <li>Hierarchical tags for flexible organization</li>
            <li>Full-text search across all your bookmarks</li>
            <li>RSS feed tracking with update notifications</li>
            <li>Browser extension for quick saving</li>
          </ul>
        </div>

        <!-- SSO button -->
        <button
          @click="ssoLogin()"
          class="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-medium transition shadow-sm bg-stone-800 dark:bg-stone-700 text-white hover:bg-stone-700 dark:hover:bg-stone-600"
        >
          Sign in with SSO
        </button>
      </div>

      <p class="mt-6 text-center text-xs text-stone-400">
        By signing in you agree to the use of cookies for authentication.
      </p>
    </div>
  </div>
</template>
