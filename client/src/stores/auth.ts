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
      const cookieToken = decodeURIComponent(match[1])
      // Don't adopt an already-expired token — otherwise we resurrect a dead
      // token from the cookie on every reload and redirect-loop forever.
      if (isExpired(cookieToken)) {
        clearToken()
        document.cookie = 'authToken=; Path=/; Max-Age=0'
        return
      }
      setToken(cookieToken)
      // Keep the cookie so browser-initiated requests (e.g. <img> for favicons)
      // can authenticate via cookie when Authorization header is not available.
    }
  }

  // Decode a JWT's exp claim and report whether it's in the past.
  // On any parse error we treat it as not-expired and let the server decide.
  function isExpired(jwt: string): boolean {
    try {
      const b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
      const payload = JSON.parse(atob(b64))
      return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now()
    } catch {
      return false
    }
  }

  return { token, isAuthenticated, logout, setToken, clearToken, checkOAuthToken }
})
