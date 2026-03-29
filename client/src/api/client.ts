import axios from 'axios'

const api = axios.create({
  baseURL: '/',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 500) {
      const msg = error.response?.data
      if (typeof msg === 'string' && msg.includes('Invalid auth token')) {
        localStorage.removeItem('authToken')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  },
)

export default api
