import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('authToken'))

  const isAuthenticated = computed(() => !!token.value)

  function setToken(t: string) {
    token.value = t
    localStorage.setItem('authToken', t)
  }

  function clearToken() {
    token.value = null
    localStorage.removeItem('authToken')
  }

  function logout() {
    clearToken()
    // Redirect to server-side logout which clears cookies and
    // redirects to the OIDC provider's end_session_endpoint.
    window.location.href = '/auth/logout'
  }

  // Check for token in cookies (after OAuth redirect)
  function checkOAuthToken() {
    const match = document.cookie.match(/(?:^|;\s*)authToken=([^;]+)/)
    if (match) {
      setToken(decodeURIComponent(match[1]))
      // Keep the cookie so browser-initiated requests (e.g. <img> for favicons)
      // can authenticate via cookie when Authorization header is not available.
    }
  }

  return { token, isAuthenticated, logout, setToken, clearToken, checkOAuthToken }
})
