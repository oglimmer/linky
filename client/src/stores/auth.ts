import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/api/client'
import { useRouter } from 'vue-router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('authToken'))
  const router = useRouter()

  const isAuthenticated = computed(() => !!token.value)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('authToken', t)
  }

  function clearToken() {
    token.value = null
    localStorage.removeItem('authToken')
  }

  async function login(email: string, password: string) {
    const { data } = await api.post('/rest/authenticate', { email, password })
    setToken(data.token)
    router.push('/links/portal')
  }

  async function logout() {
    try {
      await api.post('/rest/logout')
    } finally {
      clearToken()
      router.push('/')
    }
  }

  // Check for token in cookies (after OAuth redirect)
  function checkOAuthToken() {
    const match = document.cookie.match(/(?:^|;\s*)authToken=([^;]+)/)
    if (match) {
      setToken(decodeURIComponent(match[1]))
      // Clear the cookie — we store in localStorage
      document.cookie = 'authToken=; Max-Age=0; path=/'
    }
  }

  return { token, isAuthenticated, login, logout, setToken, clearToken, checkOAuthToken }
})
