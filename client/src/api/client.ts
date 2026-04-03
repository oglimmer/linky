type RequestOptions = {
  params?: Record<string, string>
}

type Response<T = any> = {
  data: T
  status: number
}

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('authToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function buildUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(path, window.location.origin)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v)
    }
  }
  return url.toString()
}

async function request<T = any>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<Response<T>> {
  const res = await fetch(buildUrl(path, options?.params), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: body != null ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401 || res.status === 500) {
    const text = await res.clone().text()
    if (text.includes('Invalid auth token')) {
      localStorage.removeItem('authToken')
      window.location.href = '/'
    }
  }

  if (!res.ok) {
    const error: any = new Error(`Request failed: ${res.status}`)
    error.response = { status: res.status, data: await res.text() }
    throw error
  }

  const contentType = res.headers.get('content-type')
  const data = contentType?.includes('application/json') ? await res.json() : await res.text()

  return { data, status: res.status }
}

const api = {
  get: <T = any>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, undefined, options),
  post: <T = any>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T = any>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T = any>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T = any>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
}

export default api
