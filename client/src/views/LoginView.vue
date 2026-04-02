<script setup lang="ts">
import { ref, onMounted } from 'vue'

const entered = ref(false)
onMounted(() => { entered.value = true })

function ssoLogin() {
  window.location.href = '/auth/oidc'
}
</script>

<template>
  <div class="flex-1 flex items-center justify-center px-4 relative grain overflow-hidden">
    <!-- Background atmosphere -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-200/30 dark:bg-primary-900/20 blur-3xl"></div>
      <div class="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-amber-100/40 dark:bg-amber-900/10 blur-3xl"></div>
      <div class="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-orange-100/20 dark:bg-orange-900/10 blur-3xl"></div>
      <!-- Extra floating blob for depth -->
      <div class="absolute top-1/2 right-1/4 w-48 h-48 rounded-full bg-primary-300/15 dark:bg-primary-800/15 blur-2xl"></div>
    </div>

    <div class="w-full max-w-lg relative z-10">
      <!-- Hero section -->
      <div class="text-center mb-12" :class="entered ? 'login-reveal' : 'opacity-0'">
        <!-- Decorative mark -->
        <div class="inline-flex items-center gap-2 mb-6">
          <span class="block w-8 h-px bg-primary-400/60 dark:bg-primary-600/60"></span>
          <span class="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-600/70 dark:text-primary-400/70">Bookmark Manager</span>
          <span class="block w-8 h-px bg-primary-400/60 dark:bg-primary-600/60"></span>
        </div>

        <h1 class="font-[--font-display] text-6xl sm:text-7xl font-semibold text-primary-800 dark:text-primary-300 tracking-tight leading-[0.95]">
          Linky
        </h1>
        <p class="mt-4 text-stone-500 dark:text-stone-400 text-base max-w-xs mx-auto leading-relaxed">
          Save, tag, and search your bookmarks. Track RSS feeds. Stay organized.
        </p>
      </div>

      <!-- Feature cards -->
      <div class="grid grid-cols-2 gap-3 mb-8" :class="entered ? 'login-reveal login-delay-1' : 'opacity-0'">
        <div class="group bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm rounded-xl p-4 border border-stone-200/50 dark:border-stone-800/50 hover:border-primary-300/60 dark:hover:border-primary-700/60 transition-all duration-300 hover:shadow-md hover:shadow-primary-100/30 dark:hover:shadow-primary-950/30">
          <div class="text-lg mb-1.5">
            <svg class="w-5 h-5 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path stroke-linecap="round" stroke-linejoin="round" d="M6 6h.008v.008H6V6z" /></svg>
          </div>
          <div class="text-xs font-semibold text-stone-700 dark:text-stone-300">Hierarchical Tags</div>
          <div class="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 leading-snug">Nested folders for flexible organization</div>
        </div>

        <div class="group bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm rounded-xl p-4 border border-stone-200/50 dark:border-stone-800/50 hover:border-primary-300/60 dark:hover:border-primary-700/60 transition-all duration-300 hover:shadow-md hover:shadow-primary-100/30 dark:hover:shadow-primary-950/30">
          <div class="text-lg mb-1.5">
            <svg class="w-5 h-5 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          </div>
          <div class="text-xs font-semibold text-stone-700 dark:text-stone-300">Full-Text Search</div>
          <div class="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 leading-snug">Find anything across all your bookmarks</div>
        </div>

        <div class="group bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm rounded-xl p-4 border border-stone-200/50 dark:border-stone-800/50 hover:border-primary-300/60 dark:hover:border-primary-700/60 transition-all duration-300 hover:shadow-md hover:shadow-primary-100/30 dark:hover:shadow-primary-950/30">
          <div class="text-lg mb-1.5">
            <svg class="w-5 h-5 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0 00-7.5-7.5H4.5m0-6.75h.75c7.87 0 14.25 6.38 14.25 14.25v.75M6 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
          </div>
          <div class="text-xs font-semibold text-stone-700 dark:text-stone-300">RSS Tracking</div>
          <div class="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 leading-snug">Know when your saved sites publish new content</div>
        </div>

        <div class="group bg-white/70 dark:bg-stone-900/70 backdrop-blur-sm rounded-xl p-4 border border-stone-200/50 dark:border-stone-800/50 hover:border-primary-300/60 dark:hover:border-primary-700/60 transition-all duration-300 hover:shadow-md hover:shadow-primary-100/30 dark:hover:shadow-primary-950/30">
          <div class="text-lg mb-1.5">
            <svg class="w-5 h-5 text-primary-500 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zm2.25 0h.008v.008H9.75V6z" /></svg>
          </div>
          <div class="text-xs font-semibold text-stone-700 dark:text-stone-300">Browser Extension</div>
          <div class="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 leading-snug">Save any page with one click from your browser</div>
        </div>
      </div>

      <!-- Sign in -->
      <div :class="entered ? 'login-reveal login-delay-2' : 'opacity-0'">
        <button
          @click="ssoLogin()"
          class="group w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-primary-600/15 dark:shadow-primary-900/30 bg-primary-700 dark:bg-primary-600 text-white hover:bg-primary-800 dark:hover:bg-primary-500 hover:shadow-xl hover:shadow-primary-600/25 dark:hover:shadow-primary-900/40 active:scale-[0.98]"
        >
          <svg class="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
          Sign in with SSO
        </button>

        <p class="mt-5 text-center text-[11px] text-stone-400 dark:text-stone-500">
          By signing in you agree to the use of cookies for authentication.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-reveal {
  animation: login-enter 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.login-delay-1 {
  animation-delay: 0.15s;
}
.login-delay-2 {
  animation-delay: 0.3s;
}

@keyframes login-enter {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
