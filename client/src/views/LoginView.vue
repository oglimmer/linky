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
  { name: 'Google', type: 'google', color: 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50' },
  { name: 'GitHub', type: 'github', color: 'bg-gray-900 text-white hover:bg-gray-800' },
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
  <div class="flex-1 flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-primary-600 dark:text-primary-400">Linky</h1>
        <p class="mt-2 text-gray-500 dark:text-gray-400">Your bookmark manager</p>
      </div>

      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 space-y-6">
        <!-- Email/password form -->
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              class="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
            />
          </div>
          <button
            type="submit"
            :disabled="submitting"
            class="w-full py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 transition"
          >
            {{ submitting ? (isRegister ? 'Creating account...' : 'Signing in...') : (isRegister ? 'Create account' : 'Sign in') }}
          </button>
          <p class="text-center text-sm text-gray-500">
            {{ isRegister ? 'Already have an account?' : "Don't have an account?" }}
            <button type="button" @click="isRegister = !isRegister" class="text-primary-600 dark:text-primary-400 font-medium hover:underline ml-1">
              {{ isRegister ? 'Sign in' : 'Register' }}
            </button>
          </p>
        </form>

        <!-- Divider -->
        <div class="relative">
          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200 dark:border-gray-700"></div></div>
          <div class="relative flex justify-center text-sm"><span class="px-3 bg-white dark:bg-gray-900 text-gray-400">or continue with</span></div>
        </div>

        <!-- OAuth buttons -->
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="provider in oauthProviders"
            :key="provider.type"
            @click="oauthLogin(provider.type)"
            :class="provider.color"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition"
          >
            {{ provider.name }}
          </button>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-gray-400">
        By signing in you agree to the use of cookies for authentication.
      </p>
    </div>
  </div>
</template>
