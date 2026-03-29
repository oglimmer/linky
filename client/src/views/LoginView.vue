<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import api from '@/api/client'

const auth = useAuthStore()
const ui = useUiStore()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const isRegister = ref(false)

const oauthProviders = [
  { name: 'Google', type: 'google', color: 'bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700' },
  { name: 'GitHub', type: 'github', color: 'bg-stone-800 dark:bg-stone-700 text-white hover:bg-stone-700 dark:hover:bg-stone-600' },
  { name: 'Facebook', type: 'facebook', color: 'bg-blue-600 text-white hover:bg-blue-700' },
  { name: 'Twitter', type: 'twitter', color: 'bg-sky-500 text-white hover:bg-sky-600' },
  { name: 'LinkedIn', type: 'linkedin', color: 'bg-blue-700 text-white hover:bg-blue-800' },
  { name: 'Bitbucket', type: 'bitbucket', color: 'bg-blue-500 text-white hover:bg-blue-600' },
  { name: 'Reddit', type: 'reddit', color: 'bg-orange-600 text-white hover:bg-orange-700' },
  { name: 'Yahoo', type: 'yahoo', color: 'bg-purple-600 text-white hover:bg-purple-700' },
]

async function handleSubmit() {
  if (!email.value || !password.value) return
  submitting.value = true
  try {
    if (isRegister.value) {
      await api.post('/rest/users', { email: email.value, password: password.value })
      ui.setInfo('Account created — signing you in...')
    }
    await auth.login(email.value, password.value)
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : (isRegister.value ? 'Registration failed' : 'Login failed')
    ui.setError(msg)
  } finally {
    submitting.value = false
  }
}

function oauthLogin(type: string) {
  window.location.href = `/auth/${type}`
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
        <!-- Email/password form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1.5">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition text-sm"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-stone-600 dark:text-stone-400 mb-1.5">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              class="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400 transition text-sm"
            />
          </div>
          <button
            type="submit"
            :disabled="submitting"
            class="w-full py-2.5 rounded-xl bg-primary-600 text-white font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition text-sm shadow-sm shadow-primary-600/20"
          >
            {{ submitting ? (isRegister ? 'Creating account...' : 'Signing in...') : (isRegister ? 'Create account' : 'Sign in') }}
          </button>
          <p class="text-center text-sm text-stone-500">
            {{ isRegister ? 'Already have an account?' : "Don't have an account?" }}
            <button type="button" @click="isRegister = !isRegister" class="text-primary-600 dark:text-primary-400 font-medium hover:underline ml-1">
              {{ isRegister ? 'Sign in' : 'Register' }}
            </button>
          </p>
        </form>

        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-stone-200 dark:border-stone-700"></div></div>
          <div class="relative flex justify-center text-xs"><span class="px-3 bg-white dark:bg-stone-900 text-stone-400">or continue with</span></div>
        </div>

        <!-- OAuth buttons -->
        <div class="grid grid-cols-2 gap-2.5">
          <button
            v-for="provider in oauthProviders"
            :key="provider.type"
            @click="oauthLogin(provider.type)"
            :class="provider.color"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium transition shadow-sm"
          >
            {{ provider.name }}
          </button>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-stone-400">
        By signing in you agree to the use of cookies for authentication.
      </p>
    </div>
  </div>
</template>
