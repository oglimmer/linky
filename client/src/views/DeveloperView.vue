<script setup lang="ts">
import { ref, reactive } from 'vue'

const baseUrl = window.location.origin
const authToken = ref('')
const collapsedGroups = reactive<Record<string, boolean>>({})
const expandedEndpoints = reactive<Record<string, boolean>>({})
const tryingOut = reactive<Record<string, boolean>>({})
const paramValues = reactive<Record<string, Record<string, string>>>({})
const requestBodies = reactive<Record<string, string>>({})
const responses = reactive<Record<string, { status: number; body: string; headers: string; time: number } | null>>({})
const loading = reactive<Record<string, boolean>>({})
const copiedCurl = reactive<Record<string, boolean>>({})

interface Param {
  name: string
  in: 'path' | 'query' | 'header'
  type: string
  required: boolean
  description: string
}

interface ResponseCode {
  code: number | string
  description: string
  example?: string
}

interface Endpoint {
  method: string
  path: string
  auth: boolean
  summary: string
  description?: string
  params?: Param[]
  requestBody?: string
  responses: ResponseCode[]
}

interface EndpointGroup {
  section: string
  description: string
  items: Endpoint[]
}

const endpoints: EndpointGroup[] = [
  {
    section: 'Authentication',
    description: 'User registration, login, and session management',
    items: [
      {
        method: 'POST',
        path: '/rest/authenticate',
        auth: false,
        summary: 'Login with email and password',
        description: 'Authenticates a user and returns a JWT token. The token is also set as an HttpOnly cookie.',
        requestBody: JSON.stringify({ email: 'user@example.com', password: 'secret' }, null, 2),
        responses: [
          { code: 200, description: 'Successful authentication', example: JSON.stringify({ token: 'eyJhbGciOiJIUzI1NiIs...' }, null, 2) },
          { code: 400, description: 'Invalid request body' },
          { code: 401, description: 'Invalid email or password' },
        ],
      },
      {
        method: 'POST',
        path: '/rest/users',
        auth: false,
        summary: 'Register a new user account',
        description: 'Creates a new user with email and password. Returns the new user ID.',
        requestBody: JSON.stringify({ email: 'user@example.com', password: 'secret' }, null, 2),
        responses: [
          { code: 201, description: 'User created', example: JSON.stringify({ id: 12345 }, null, 2) },
          { code: 400, description: 'Invalid request or missing fields' },
          { code: 403, description: 'Email/password registration is disabled' },
          { code: 409, description: 'Email already taken' },
        ],
      },
      {
        method: 'POST',
        path: '/rest/logout',
        auth: true,
        summary: 'Logout current session',
        description: 'Clears the authToken and visitorToken cookies.',
        responses: [
          { code: 200, description: 'Logged out', example: '"ok"' },
        ],
      },
      {
        method: 'GET',
        path: '/rest/users/me',
        auth: true,
        summary: 'Get current user info',
        description: 'Returns the authenticated user\'s profile.',
        responses: [
          {
            code: 200,
            description: 'User profile',
            example: JSON.stringify({
              id: 12345,
              email: 'user@example.com',
              source: 'email',
              sourceId: null,
              sourceData: null,
              createdDate: '2025-01-15T10:00:00Z',
            }, null, 2),
          },
          { code: 401, description: 'Unauthorized' },
          { code: 404, description: 'User not found' },
        ],
      },
      {
        method: 'DELETE',
        path: '/rest/users/me',
        auth: true,
        summary: 'Delete current user account and all data',
        description: 'Permanently deletes the user account, all links, tags, and associated data.',
        responses: [
          { code: 200, description: 'Account deleted', example: JSON.stringify({ result: 'ok' }, null, 2) },
          { code: 401, description: 'Unauthorized' },
          { code: 500, description: 'Failed to delete user' },
        ],
      },
    ],
  },
  {
    section: 'Links',
    description: 'Create, read, update, and delete bookmarks',
    items: [
      {
        method: 'POST',
        path: '/rest/links',
        auth: true,
        summary: 'Create a new link',
        description: 'Creates a bookmark. The server automatically resolves the page title, favicon, and detects RSS feeds if not provided.',
        requestBody: JSON.stringify({
          url: 'https://example.com',
          tags: 'dev tools',
          rssUrl: '',
          pageTitle: '',
          notes: '',
        }, null, 2),
        responses: [
          {
            code: 201,
            description: 'Link created',
            example: JSON.stringify({
              primary: {
                id: 1,
                linkUrl: 'https://example.com',
                tags: ['dev', 'tools'],
                rssUrl: null,
                pageTitle: 'Example Domain',
                notes: null,
                faviconUrl: 'https://example.com/favicon.ico',
                callCounter: 0,
                lastCalled: null,
                createdDate: '2025-01-15T10:00:00Z',
              },
              collateral: [],
            }, null, 2),
          },
          { code: 400, description: 'Invalid request or missing URL' },
          { code: 401, description: 'Unauthorized' },
          { code: 500, description: 'Creation failed' },
        ],
      },
      {
        method: 'PUT',
        path: '/rest/links/{linkid}',
        auth: true,
        summary: 'Update an existing link',
        description: 'Updates a link\'s URL, tags, RSS URL, title, or notes.',
        params: [
          { name: 'linkid', in: 'path', type: 'integer', required: true, description: 'Link ID' },
        ],
        requestBody: JSON.stringify({
          url: 'https://example.com',
          tags: 'dev tools updated',
          rssUrl: '',
          pageTitle: 'Updated Title',
          notes: 'Some notes',
        }, null, 2),
        responses: [
          {
            code: 200,
            description: 'Link updated',
            example: JSON.stringify({
              primary: {
                id: 1,
                linkUrl: 'https://example.com',
                tags: ['dev', 'tools', 'updated'],
                rssUrl: null,
                pageTitle: 'Updated Title',
                notes: 'Some notes',
                faviconUrl: 'https://example.com/favicon.ico',
                callCounter: 5,
                lastCalled: '2025-01-20T15:30:00Z',
                createdDate: '2025-01-15T10:00:00Z',
              },
              collateral: [],
            }, null, 2),
          },
          { code: 400, description: 'Invalid link ID or request body' },
          { code: 401, description: 'Unauthorized' },
          { code: 500, description: 'Update failed' },
        ],
      },
      {
        method: 'GET',
        path: '/rest/links/{tags}',
        auth: true,
        summary: 'Get links by tag',
        description: 'Returns all links matching the given tag. Use system tags like "all", "archive", "rss", "untagged", or any user tag.',
        params: [
          { name: 'tags', in: 'path', type: 'string', required: true, description: 'Tag name (e.g. "all", "dev", "archive")' },
        ],
        responses: [
          {
            code: 200,
            description: 'Array of links',
            example: JSON.stringify([
              {
                id: 1,
                linkUrl: 'https://example.com',
                tags: ['dev', 'tools'],
                rssUrl: null,
                pageTitle: 'Example Domain',
                notes: null,
                faviconUrl: 'https://example.com/favicon.ico',
                callCounter: 5,
                lastCalled: '2025-01-20T15:30:00Z',
                createdDate: '2025-01-15T10:00:00Z',
              },
            ], null, 2),
          },
          { code: 401, description: 'Unauthorized' },
          { code: 500, description: 'Retrieval failed' },
        ],
      },
      {
        method: 'DELETE',
        path: '/rest/links/{linkid}',
        auth: true,
        summary: 'Delete a link',
        params: [
          { name: 'linkid', in: 'path', type: 'integer', required: true, description: 'Link ID' },
        ],
        responses: [
          { code: 200, description: 'Link deleted', example: JSON.stringify({ result: 'ok' }, null, 2) },
          { code: 400, description: 'Invalid link ID' },
          { code: 401, description: 'Unauthorized' },
          { code: 500, description: 'Deletion failed' },
        ],
      },
      {
        method: 'GET',
        path: '/rest/search/links',
        auth: true,
        summary: 'Full-text search links',
        description: 'Searches across link URL, title, notes, and tags using MariaDB full-text indexes.',
        params: [
          { name: 'q', in: 'query', type: 'string', required: true, description: 'Search query' },
        ],
        responses: [
          {
            code: 200,
            description: 'Matching links',
            example: JSON.stringify([
              {
                id: 1,
                linkUrl: 'https://example.com',
                tags: ['dev'],
                pageTitle: 'Example',
                callCounter: 0,
                createdDate: '2025-01-15T10:00:00Z',
              },
            ], null, 2),
          },
          { code: 400, description: 'Missing query parameter q' },
          { code: 401, description: 'Unauthorized' },
          { code: 500, description: 'Search failed' },
        ],
      },
      {
        method: 'PATCH',
        path: '/rest/links/tags',
        auth: true,
        summary: 'Rename a tag across all links',
        description: 'Renames a tag on every link that has it. Returns the number of affected links.',
        requestBody: JSON.stringify({ oldTagName: 'old-name', newTagName: 'new-name' }, null, 2),
        responses: [
          { code: 200, description: 'Tag renamed', example: JSON.stringify({ count: 5 }, null, 2) },
          { code: 400, description: 'Invalid request or rename failed' },
          { code: 401, description: 'Unauthorized' },
        ],
      },
      {
        method: 'GET',
        path: '/rest/links/{linkid}/favicon',
        auth: true,
        summary: 'Get proxied favicon for a link',
        description: 'Returns the favicon image for a link. The response is binary image data with appropriate Content-Type header and Cache-Control: public, max-age=86400.',
        params: [
          { name: 'linkid', in: 'path', type: 'integer', required: true, description: 'Link ID' },
        ],
        responses: [
          { code: 200, description: 'Favicon image (binary)' },
          { code: 400, description: 'Invalid link ID' },
          { code: 401, description: 'Unauthorized' },
          { code: 404, description: 'Favicon not found' },
        ],
      },
    ],
  },
  {
    section: 'Tags',
    description: 'Tag hierarchy management',
    items: [
      {
        method: 'GET',
        path: '/rest/tags/hierarchy',
        auth: true,
        summary: 'Get the tag hierarchy with counts',
        description: 'Returns the full tag tree structure and the number of links per tag.',
        responses: [
          {
            code: 200,
            description: 'Tag hierarchy',
            example: JSON.stringify({
              tree: [
                { name: 'technology', parent: null, index: 0 },
                { name: 'web', parent: 'technology', index: 1 },
              ],
              tagCount: { technology: 12, web: 8 },
            }, null, 2),
          },
          { code: 401, description: 'Unauthorized' },
          { code: 500, description: 'Failed to retrieve hierarchy' },
        ],
      },
      {
        method: 'PUT',
        path: '/rest/tags/hierarchy',
        auth: true,
        summary: 'Save the tag hierarchy',
        description: 'Replaces the entire tag tree. Each node has a name, optional parent, and sort index.',
        requestBody: JSON.stringify({
          tree: [
            { name: 'technology', parent: null, index: 0 },
            { name: 'web', parent: 'technology', index: 1 },
          ],
        }, null, 2),
        responses: [
          { code: 200, description: 'Hierarchy saved', example: JSON.stringify({ result: 'ok' }, null, 2) },
          { code: 400, description: 'Invalid request' },
          { code: 401, description: 'Unauthorized' },
        ],
      },
      {
        method: 'DELETE',
        path: '/rest/tags/{name}',
        auth: true,
        summary: 'Delete a tag',
        description: 'Removes a tag from all links and the hierarchy.',
        params: [
          { name: 'name', in: 'path', type: 'string', required: true, description: 'Tag name' },
        ],
        responses: [
          { code: 200, description: 'Tag deleted', example: JSON.stringify({ result: 'ok' }, null, 2) },
          { code: 400, description: 'Invalid request' },
          { code: 401, description: 'Unauthorized' },
        ],
      },
    ],
  },
  {
    section: 'RSS Feeds',
    description: 'RSS feed update tracking for bookmarked sites',
    items: [
      {
        method: 'GET',
        path: '/rest/links/{linkid}/rss',
        auth: true,
        summary: 'Get unread RSS update count',
        description: 'Returns the number of unread feed entries for a link with an RSS feed.',
        params: [
          { name: 'linkid', in: 'path', type: 'integer', required: true, description: 'Link ID' },
        ],
        responses: [
          { code: 200, description: 'Update count', example: JSON.stringify({ result: 3 }, null, 2) },
          { code: 400, description: 'Invalid link ID' },
          { code: 401, description: 'Unauthorized' },
        ],
      },
      {
        method: 'GET',
        path: '/rest/links/{linkid}/rssDetails',
        auth: true,
        summary: 'Get RSS feed entries',
        description: 'Returns the unread count and a list of recent feed entries with title and link.',
        params: [
          { name: 'linkid', in: 'path', type: 'integer', required: true, description: 'Link ID' },
        ],
        responses: [
          {
            code: 200,
            description: 'Feed details',
            example: JSON.stringify({
              result: 3,
              display: [
                { title: 'New Article Title', link: 'https://example.com/article-1' },
                { title: 'Another Post', link: 'https://example.com/article-2' },
              ],
            }, null, 2),
          },
          { code: 400, description: 'Invalid link ID' },
          { code: 401, description: 'Unauthorized' },
        ],
      },
    ],
  },
  {
    section: 'Click Tracking',
    description: 'Link click tracking and redirect',
    items: [
      {
        method: 'GET',
        path: '/leave',
        auth: true,
        summary: 'Track click and redirect',
        description: 'Increments the link\'s click counter, marks RSS feed as read (if applicable), and redirects (302) to the link\'s URL.',
        params: [
          { name: 'target', in: 'query', type: 'integer', required: true, description: 'Link ID to redirect to' },
        ],
        responses: [
          { code: 302, description: 'Redirect to link URL' },
          { code: 400, description: 'Invalid target parameter' },
          { code: 401, description: 'Unauthorized' },
          { code: 404, description: 'Link not found' },
        ],
      },
    ],
  },
]

const models = [
  {
    name: 'Link',
    description: 'A bookmarked URL with metadata',
    fields: [
      { name: 'id', type: 'integer', description: 'Unique link identifier' },
      { name: 'linkUrl', type: 'string', description: 'The bookmarked URL' },
      { name: 'tags', type: 'string[]', description: 'Array of tag names' },
      { name: 'rssUrl', type: 'string | null', description: 'RSS feed URL, if detected' },
      { name: 'pageTitle', type: 'string | null', description: 'Page title' },
      { name: 'notes', type: 'string | null', description: 'User notes' },
      { name: 'faviconUrl', type: 'string | null', description: 'Favicon URL' },
      { name: 'callCounter', type: 'integer', description: 'Number of times accessed via /leave' },
      { name: 'lastCalled', type: 'string | null', description: 'ISO 8601 timestamp of last access' },
      { name: 'createdDate', type: 'string', description: 'ISO 8601 creation timestamp' },
    ],
  },
  {
    name: 'LinkCreateResponse',
    description: 'Response from creating or updating a link',
    fields: [
      { name: 'primary', type: 'Link', description: 'The created/updated link' },
      { name: 'collateral', type: 'Link[]', description: 'Other links affected by the operation' },
    ],
  },
  {
    name: 'User',
    description: 'User account information',
    fields: [
      { name: 'id', type: 'integer', description: 'User ID' },
      { name: 'email', type: 'string', description: 'Email address' },
      { name: 'source', type: 'string', description: 'Auth source: "email", "github", "google", or "twitter"' },
      { name: 'sourceId', type: 'string | null', description: 'OAuth provider user ID' },
      { name: 'sourceData', type: 'object | null', description: 'Raw OAuth provider data' },
      { name: 'createdDate', type: 'string', description: 'ISO 8601 account creation timestamp' },
    ],
  },
  {
    name: 'TagNode',
    description: 'A node in the tag hierarchy tree',
    fields: [
      { name: 'name', type: 'string', description: 'Tag name' },
      { name: 'parent', type: 'string | null', description: 'Parent tag name, null for root nodes' },
      { name: 'index', type: 'integer', description: 'Sort order within parent' },
    ],
  },
  {
    name: 'TagHierarchy',
    description: 'Full tag tree with link counts',
    fields: [
      { name: 'tree', type: 'TagNode[]', description: 'Array of tag nodes' },
      { name: 'tagCount', type: 'Record<string, number>', description: 'Map of tag name to link count' },
    ],
  },
  {
    name: 'FeedEntry',
    description: 'An RSS feed entry',
    fields: [
      { name: 'title', type: 'string', description: 'Entry title' },
      { name: 'link', type: 'string', description: 'Entry URL' },
    ],
  },
]

const methodColor: Record<string, string> = {
  GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  PATCH: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

const methodBorder: Record<string, string> = {
  GET: 'border-l-emerald-400 dark:border-l-emerald-600',
  POST: 'border-l-blue-400 dark:border-l-blue-600',
  PUT: 'border-l-amber-400 dark:border-l-amber-600',
  PATCH: 'border-l-orange-400 dark:border-l-orange-600',
  DELETE: 'border-l-red-400 dark:border-l-red-600',
}

const methodBg: Record<string, string> = {
  GET: 'bg-emerald-50/50 dark:bg-emerald-950/20',
  POST: 'bg-blue-50/50 dark:bg-blue-950/20',
  PUT: 'bg-amber-50/50 dark:bg-amber-950/20',
  PATCH: 'bg-orange-50/50 dark:bg-orange-950/20',
  DELETE: 'bg-red-50/50 dark:bg-red-950/20',
}

const responseCodeColor: Record<string, string> = {
  '2': 'text-emerald-600 dark:text-emerald-400',
  '3': 'text-blue-600 dark:text-blue-400',
  '4': 'text-amber-600 dark:text-amber-400',
  '5': 'text-red-600 dark:text-red-400',
}

function epKey(ep: Endpoint) {
  return `${ep.method}:${ep.path}`
}

function toggleGroup(section: string) {
  collapsedGroups[section] = !collapsedGroups[section]
}

function toggleEndpoint(ep: Endpoint) {
  const key = epKey(ep)
  expandedEndpoints[key] = !expandedEndpoints[key]
}

function toggleTryIt(ep: Endpoint) {
  const key = epKey(ep)
  tryingOut[key] = !tryingOut[key]
  if (tryingOut[key]) {
    if (!paramValues[key]) paramValues[key] = {}
    if (ep.params) {
      for (const p of ep.params) {
        if (!paramValues[key][p.name]) paramValues[key][p.name] = ''
      }
    }
    if (ep.requestBody && !requestBodies[key]) {
      requestBodies[key] = ep.requestBody
    }
  }
}

function buildUrl(ep: Endpoint): string {
  const key = epKey(ep)
  let url = ep.path
  const queryParams: string[] = []

  if (ep.params) {
    for (const p of ep.params) {
      const val = paramValues[key]?.[p.name] || `{${p.name}}`
      if (p.in === 'path') {
        url = url.replace(`{${p.name}}`, val)
      } else if (p.in === 'query' && val && val !== `{${p.name}}`) {
        queryParams.push(`${p.name}=${encodeURIComponent(val)}`)
      }
    }
  }

  if (queryParams.length) {
    url += '?' + queryParams.join('&')
  }

  return url
}

function buildCurl(ep: Endpoint): string {
  const key = epKey(ep)
  const url = baseUrl + buildUrl(ep)
  const parts = [`curl -X ${ep.method}`]

  if (ep.auth) {
    const token = authToken.value || '<token>'
    parts.push(`  -H 'Authorization: Bearer ${token}'`)
  }

  if (ep.requestBody) {
    parts.push(`  -H 'Content-Type: application/json'`)
    const body = requestBodies[key] || ep.requestBody
    parts.push(`  -d '${body.replace(/\n\s*/g, ' ').trim()}'`)
  }

  parts.push(`  '${url}'`)
  return parts.join(' \\\n')
}

async function copyCurl(ep: Endpoint) {
  const key = epKey(ep)
  await navigator.clipboard.writeText(buildCurl(ep))
  copiedCurl[key] = true
  setTimeout(() => { copiedCurl[key] = false }, 2000)
}

async function executeRequest(ep: Endpoint) {
  const key = epKey(ep)
  loading[key] = true
  responses[key] = null

  const url = baseUrl + buildUrl(ep)
  const headers: Record<string, string> = {}

  if (ep.auth && authToken.value) {
    headers['Authorization'] = `Bearer ${authToken.value}`
  }

  if (ep.requestBody) {
    headers['Content-Type'] = 'application/json'
  }

  const start = performance.now()
  try {
    const res = await fetch(url, {
      method: ep.method,
      headers,
      body: ep.requestBody ? (requestBodies[key] || ep.requestBody) : undefined,
      redirect: 'manual',
    })
    const elapsed = Math.round(performance.now() - start)
    const text = await res.text()

    let formattedBody: string
    try {
      formattedBody = JSON.stringify(JSON.parse(text), null, 2)
    } catch {
      formattedBody = text
    }

    const resHeaders: string[] = []
    res.headers.forEach((v, k) => resHeaders.push(`${k}: ${v}`))

    responses[key] = {
      status: res.status,
      body: formattedBody,
      headers: resHeaders.join('\n'),
      time: elapsed,
    }
  } catch (err: any) {
    responses[key] = {
      status: 0,
      body: err.message || 'Network error',
      headers: '',
      time: Math.round(performance.now() - start),
    }
  } finally {
    loading[key] = false
  }
}

function getResponseCodeColor(code: number | string) {
  const first = String(code)[0]
  return responseCodeColor[first] || 'text-stone-600 dark:text-stone-400'
}

const modelsExpanded = ref(true)
const expandedModels = reactive<Record<string, boolean>>({})
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
    <!-- Header -->
    <div>
      <h1 class="text-xl font-semibold text-stone-800 dark:text-stone-200 font-[--font-display] tracking-tight">Linky API</h1>
      <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">REST API reference for building integrations with Linky.</p>
      <div class="mt-2 text-xs text-stone-400 dark:text-stone-500 font-mono">
        Base URL: <span class="text-primary-600 dark:text-primary-400">{{ baseUrl }}</span>
      </div>
    </div>

    <!-- Introduction -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300">Introduction</h2>
      <div class="text-sm text-stone-600 dark:text-stone-400 space-y-2">
        <p>The Linky API lets you programmatically manage your bookmarks, tags, and RSS feeds. You can use it to build browser extensions, CLI tools, mobile apps, import/export scripts, or any custom integration.</p>
        <p>The API follows REST conventions: resources are accessed via predictable URLs, standard HTTP methods indicate the action, and all data is exchanged as JSON.</p>
      </div>
    </section>

    <!-- Quick start -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300">Quick Start</h2>
      <div class="text-sm text-stone-600 dark:text-stone-400 space-y-2">
        <p>Get up and running in three steps:</p>
      </div>
      <div class="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm divide-y divide-stone-100 dark:divide-stone-800">
        <div class="px-4 py-3 flex gap-3 items-start">
          <span class="shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center mt-0.5">1</span>
          <div class="text-sm">
            <div class="font-medium text-stone-700 dark:text-stone-300">Authenticate</div>
            <div class="text-stone-500 dark:text-stone-400 mt-0.5">
              Send your credentials to <code class="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">POST /rest/authenticate</code> to receive a JWT token.
            </div>
          </div>
        </div>
        <div class="px-4 py-3 flex gap-3 items-start">
          <span class="shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center mt-0.5">2</span>
          <div class="text-sm">
            <div class="font-medium text-stone-700 dark:text-stone-300">Include the token</div>
            <div class="text-stone-500 dark:text-stone-400 mt-0.5">
              Add <code class="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">Authorization: Bearer &lt;token&gt;</code> to all subsequent requests.
            </div>
          </div>
        </div>
        <div class="px-4 py-3 flex gap-3 items-start">
          <span class="shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 text-xs font-bold flex items-center justify-center mt-0.5">3</span>
          <div class="text-sm">
            <div class="font-medium text-stone-700 dark:text-stone-300">Start making requests</div>
            <div class="text-stone-500 dark:text-stone-400 mt-0.5">
              Create a bookmark with <code class="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">POST /rest/links</code>, list them with <code class="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">GET /rest/links/all</code>, or search with <code class="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">GET /rest/search/links?q=...</code>.
            </div>
          </div>
        </div>
      </div>
      <div class="space-y-1">
        <div class="text-xs font-medium text-stone-500 dark:text-stone-400">Example: Authenticate and list all bookmarks</div>
        <pre class="bg-stone-900 dark:bg-stone-950 rounded-lg px-4 py-3 text-xs font-mono text-stone-300 overflow-x-auto"># 1. Get a token
TOKEN=$(curl -s -X POST {{ baseUrl }}/rest/authenticate \
  -H 'Content-Type: application/json' \
  -d '{"email": "you@example.com", "password": "secret"}' \
  | jq -r '.token')

# 2. List all bookmarks
curl -s {{ baseUrl }}/rest/links/all \
  -H "Authorization: Bearer $TOKEN" | jq .</pre>
      </div>
    </section>

    <!-- Conventions -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300">Conventions</h2>
      <div class="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm divide-y divide-stone-100 dark:divide-stone-800">
        <div class="px-4 py-2.5 flex items-baseline gap-4 text-sm">
          <span class="shrink-0 w-28 text-xs font-medium text-stone-500 dark:text-stone-400">Content type</span>
          <span class="text-stone-600 dark:text-stone-400">All request and response bodies use <code class="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">application/json</code>.</span>
        </div>
        <div class="px-4 py-2.5 flex items-baseline gap-4 text-sm">
          <span class="shrink-0 w-28 text-xs font-medium text-stone-500 dark:text-stone-400">Timestamps</span>
          <span class="text-stone-600 dark:text-stone-400">All dates are ISO 8601 in UTC, e.g. <code class="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">2025-01-15T10:00:00Z</code>.</span>
        </div>
        <div class="px-4 py-2.5 flex items-baseline gap-4 text-sm">
          <span class="shrink-0 w-28 text-xs font-medium text-stone-500 dark:text-stone-400">Empty lists</span>
          <span class="text-stone-600 dark:text-stone-400">Empty collections return <code class="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">[]</code>, never <code class="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">null</code>.</span>
        </div>
        <div class="px-4 py-2.5 flex items-baseline gap-4 text-sm">
          <span class="shrink-0 w-28 text-xs font-medium text-stone-500 dark:text-stone-400">Null fields</span>
          <span class="text-stone-600 dark:text-stone-400">Optional fields that have no value are returned as <code class="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">null</code>, not omitted.</span>
        </div>
        <div class="px-4 py-2.5 flex items-baseline gap-4 text-sm">
          <span class="shrink-0 w-28 text-xs font-medium text-stone-500 dark:text-stone-400">Tags format</span>
          <span class="text-stone-600 dark:text-stone-400">When creating or updating links, tags are sent as a space-separated string (<code class="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">"dev tools go"</code>). In responses, they are returned as an array.</span>
        </div>
      </div>
    </section>

    <!-- Error handling -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300">Error Handling</h2>
      <div class="text-sm text-stone-600 dark:text-stone-400 space-y-2">
        <p>The API uses standard HTTP status codes. Errors return a JSON object with an <code class="font-mono text-xs bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">error</code> field describing what went wrong.</p>
      </div>
      <div class="space-y-1">
        <pre class="bg-stone-900 dark:bg-stone-950 rounded-lg px-4 py-3 text-xs font-mono text-stone-300 overflow-x-auto">{ "error": "invalid link id" }</pre>
      </div>
      <div class="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm divide-y divide-stone-100 dark:divide-stone-800">
        <div class="px-4 py-2.5 flex items-baseline gap-4 text-sm">
          <code class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0 w-12">2xx</code>
          <span class="text-stone-600 dark:text-stone-400">Success. The response body contains the requested data or a confirmation.</span>
        </div>
        <div class="px-4 py-2.5 flex items-baseline gap-4 text-sm">
          <code class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 w-12">400</code>
          <span class="text-stone-600 dark:text-stone-400">Bad request. The request body is malformed, a required field is missing, or a parameter is invalid.</span>
        </div>
        <div class="px-4 py-2.5 flex items-baseline gap-4 text-sm">
          <code class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 w-12">401</code>
          <span class="text-stone-600 dark:text-stone-400">Unauthorized. The JWT token is missing, expired, or invalid.</span>
        </div>
        <div class="px-4 py-2.5 flex items-baseline gap-4 text-sm">
          <code class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 w-12">404</code>
          <span class="text-stone-600 dark:text-stone-400">Not found. The requested resource does not exist.</span>
        </div>
        <div class="px-4 py-2.5 flex items-baseline gap-4 text-sm">
          <code class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 shrink-0 w-12">409</code>
          <span class="text-stone-600 dark:text-stone-400">Conflict. The resource already exists (e.g. duplicate email on registration).</span>
        </div>
        <div class="px-4 py-2.5 flex items-baseline gap-4 text-sm">
          <code class="font-mono text-xs font-bold text-red-600 dark:text-red-400 shrink-0 w-12">500</code>
          <span class="text-stone-600 dark:text-stone-400">Server error. Something went wrong on our end. Try again or contact support.</span>
        </div>
      </div>
    </section>

    <!-- System tags -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300">System Tags</h2>
      <div class="text-sm text-stone-600 dark:text-stone-400 space-y-2">
        <p>Linky automatically maintains special tags that you can use to filter links. These cannot be assigned or removed manually.</p>
      </div>
      <div class="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm divide-y divide-stone-100 dark:divide-stone-800">
        <div class="flex items-baseline gap-4 px-4 py-2.5 text-sm" v-for="tag in [
          { name: 'all', desc: 'Every link in your account.' },
          { name: 'portal', desc: 'Your default landing page view (same as all, sorted by recent activity).' },
          { name: 'archive', desc: 'Links you have archived.' },
          { name: 'untagged', desc: 'Links with no user-assigned tags.' },
          { name: 'rss', desc: 'Links that have a detected RSS feed.' },
          { name: 'duedate', desc: 'Links tagged with a date in YYYY-MM-DD format.' },
          { name: 'locked', desc: 'Links excluded from periodic link checking.' },
        ]" :key="tag.name">
          <code class="font-mono text-primary-600 dark:text-primary-400 shrink-0 w-20">{{ tag.name }}</code>
          <span class="text-stone-600 dark:text-stone-400">{{ tag.desc }}</span>
        </div>
      </div>
    </section>

    <!-- Auth token input -->
    <section class="space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300">Authorization</h2>
      </div>
      <div class="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm p-4 space-y-3">
        <p class="text-xs text-stone-500 dark:text-stone-400">
          Protected endpoints require a JWT token. Obtain one via <code class="font-mono bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">POST /rest/authenticate</code>, then enter it below to use "Try it out".
        </p>
        <div class="flex gap-2">
          <input
            v-model="authToken"
            type="text"
            placeholder="Paste your JWT token here..."
            class="flex-1 text-sm font-mono bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-stone-700 dark:text-stone-300 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
          />
          <button
            v-if="authToken"
            @click="authToken = ''"
            class="text-xs px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition"
          >
            Clear
          </button>
        </div>
        <div class="text-xs font-mono text-stone-400 dark:text-stone-500">
          Authorization: Bearer {{ authToken || '&lt;token&gt;' }}
        </div>
      </div>
    </section>

    <!-- API explorer divider -->
    <div class="border-t border-stone-200 dark:border-stone-800 pt-6">
      <h2 class="text-lg font-semibold text-stone-800 dark:text-stone-200 font-[--font-display] tracking-tight">API Explorer</h2>
      <p class="mt-1 text-sm text-stone-500 dark:text-stone-400">Browse endpoints, inspect parameters and response shapes, or try requests directly from this page.</p>
    </div>

    <!-- Endpoint groups -->
    <template v-for="group in endpoints" :key="group.section">
      <section class="space-y-0">
        <!-- Group header -->
        <button
          @click="toggleGroup(group.section)"
          class="w-full flex items-center gap-3 py-3 text-left group"
        >
          <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300">{{ group.section }}</h2>
          <span class="text-xs text-stone-400 dark:text-stone-500">{{ group.description }}</span>
          <svg
            class="ml-auto w-4 h-4 text-stone-400 transition-transform"
            :class="{ '-rotate-90': collapsedGroups[group.section] }"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <!-- Endpoint list -->
        <div v-show="!collapsedGroups[group.section]" class="space-y-2">
          <div
            v-for="ep in group.items"
            :key="epKey(ep)"
            class="rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden border-l-4"
            :class="methodBorder[ep.method]"
          >
            <!-- Endpoint summary row -->
            <button
              @click="toggleEndpoint(ep)"
              class="w-full flex items-center gap-3 px-4 py-3 text-left transition"
              :class="[
                expandedEndpoints[epKey(ep)]
                  ? methodBg[ep.method]
                  : 'bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/50'
              ]"
            >
              <span
                :class="methodColor[ep.method]"
                class="shrink-0 px-2.5 py-0.5 rounded text-[11px] font-bold font-mono uppercase min-w-[60px] text-center"
              >{{ ep.method }}</span>
              <code class="text-sm font-mono text-stone-700 dark:text-stone-300">{{ ep.path }}</code>
              <span class="text-sm text-stone-500 dark:text-stone-400 truncate hidden sm:inline">{{ ep.summary }}</span>
              <div class="ml-auto flex items-center gap-2 shrink-0">
                <span v-if="ep.auth" class="text-[10px] font-medium text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <svg
                  class="w-4 h-4 text-stone-400 transition-transform"
                  :class="{ 'rotate-180': expandedEndpoints[epKey(ep)] }"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            <!-- Expanded detail -->
            <div v-if="expandedEndpoints[epKey(ep)]" class="border-t border-stone-200 dark:border-stone-800" :class="methodBg[ep.method]">
              <div class="px-4 py-4 space-y-5">
                <!-- Description -->
                <p v-if="ep.description" class="text-sm text-stone-600 dark:text-stone-400">{{ ep.description }}</p>

                <!-- Parameters -->
                <div v-if="ep.params?.length" class="space-y-2">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Parameters</h3>
                    <button
                      @click="toggleTryIt(ep)"
                      class="text-xs px-3 py-1 rounded-md border transition font-medium"
                      :class="tryingOut[epKey(ep)]
                        ? 'border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                        : 'border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'"
                    >
                      {{ tryingOut[epKey(ep)] ? 'Cancel' : 'Try it out' }}
                    </button>
                  </div>
                  <div class="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
                    <table class="w-full text-sm">
                      <thead>
                        <tr class="border-b border-stone-100 dark:border-stone-800">
                          <th class="text-left px-3 py-2 text-xs font-medium text-stone-500 dark:text-stone-400 w-32">Name</th>
                          <th class="text-left px-3 py-2 text-xs font-medium text-stone-500 dark:text-stone-400">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="p in ep.params" :key="p.name" class="border-b border-stone-50 dark:border-stone-800/50 last:border-0">
                          <td class="px-3 py-2.5 align-top">
                            <div>
                              <code class="font-mono text-stone-800 dark:text-stone-200 text-xs">{{ p.name }}</code>
                              <span v-if="p.required" class="text-red-500 text-xs ml-0.5">*</span>
                              <span class="text-[10px] text-red-500 font-medium ml-1" v-if="p.required">required</span>
                            </div>
                            <div class="text-[10px] text-stone-400 dark:text-stone-500 font-mono mt-0.5">
                              {{ p.type }}
                              <span class="italic">({{ p.in }})</span>
                            </div>
                          </td>
                          <td class="px-3 py-2.5 align-top">
                            <div class="text-stone-600 dark:text-stone-400 text-xs">{{ p.description }}</div>
                            <input
                              v-if="tryingOut[epKey(ep)]"
                              v-model="paramValues[epKey(ep)][p.name]"
                              :placeholder="p.name"
                              class="mt-1.5 w-full text-xs font-mono bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-700 rounded px-2 py-1.5 text-stone-700 dark:text-stone-300 placeholder:text-stone-400 dark:placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-primary-500/30"
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Request body -->
                <div v-if="ep.requestBody" class="space-y-2">
                  <div class="flex items-center justify-between">
                    <h3 class="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Request body</h3>
                    <button
                      v-if="!ep.params?.length"
                      @click="toggleTryIt(ep)"
                      class="text-xs px-3 py-1 rounded-md border transition font-medium"
                      :class="tryingOut[epKey(ep)]
                        ? 'border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                        : 'border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'"
                    >
                      {{ tryingOut[epKey(ep)] ? 'Cancel' : 'Try it out' }}
                    </button>
                  </div>
                  <textarea
                    v-if="tryingOut[epKey(ep)]"
                    v-model="requestBodies[epKey(ep)]"
                    rows="8"
                    class="w-full text-xs font-mono bg-stone-900 dark:bg-stone-950 text-stone-200 border border-stone-700 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary-500/30 resize-y"
                  />
                  <pre v-else class="bg-stone-900 dark:bg-stone-950 rounded-lg px-4 py-3 text-xs font-mono text-stone-300 overflow-x-auto">{{ ep.requestBody }}</pre>
                </div>

                <!-- Try it out: no params, no body endpoints -->
                <div v-if="!ep.params?.length && !ep.requestBody">
                  <button
                    @click="toggleTryIt(ep)"
                    class="text-xs px-3 py-1 rounded-md border transition font-medium"
                    :class="tryingOut[epKey(ep)]
                      ? 'border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                      : 'border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'"
                  >
                    {{ tryingOut[epKey(ep)] ? 'Cancel' : 'Try it out' }}
                  </button>
                </div>

                <!-- Execute + Curl -->
                <div v-if="tryingOut[epKey(ep)]" class="space-y-3">
                  <button
                    @click="executeRequest(ep)"
                    :disabled="loading[epKey(ep)]"
                    class="w-full py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition shadow-sm"
                  >
                    {{ loading[epKey(ep)] ? 'Executing...' : 'Execute' }}
                  </button>

                  <!-- Curl -->
                  <div class="space-y-1">
                    <div class="flex items-center justify-between">
                      <h3 class="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Curl</h3>
                      <button
                        @click="copyCurl(ep)"
                        class="text-[10px] text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition"
                      >
                        {{ copiedCurl[epKey(ep)] ? 'Copied!' : 'Copy' }}
                      </button>
                    </div>
                    <pre class="bg-stone-900 dark:bg-stone-950 rounded-lg px-4 py-3 text-xs font-mono text-stone-300 overflow-x-auto whitespace-pre-wrap">{{ buildCurl(ep) }}</pre>
                  </div>

                  <!-- Response -->
                  <div v-if="responses[epKey(ep)]" class="space-y-1">
                    <h3 class="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Server response</h3>
                    <div class="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden">
                      <div class="flex items-center gap-3 px-3 py-2 border-b border-stone-100 dark:border-stone-800 text-xs">
                        <span class="font-mono font-bold" :class="getResponseCodeColor(responses[epKey(ep)]!.status)">
                          {{ responses[epKey(ep)]!.status || 'Error' }}
                        </span>
                        <span class="text-stone-400 dark:text-stone-500">{{ responses[epKey(ep)]!.time }}ms</span>
                      </div>
                      <pre class="px-4 py-3 text-xs font-mono text-stone-700 dark:text-stone-300 overflow-x-auto max-h-80 overflow-y-auto">{{ responses[epKey(ep)]!.body }}</pre>
                    </div>
                  </div>
                </div>

                <!-- Response codes -->
                <div class="space-y-2">
                  <h3 class="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">Responses</h3>
                  <div class="bg-white dark:bg-stone-900 rounded-lg border border-stone-200 dark:border-stone-800 overflow-hidden divide-y divide-stone-100 dark:divide-stone-800">
                    <div v-for="r in ep.responses" :key="r.code" class="px-3 py-2.5">
                      <div class="flex items-baseline gap-3">
                        <code class="font-mono text-xs font-bold shrink-0" :class="getResponseCodeColor(r.code)">{{ r.code }}</code>
                        <span class="text-xs text-stone-600 dark:text-stone-400">{{ r.description }}</span>
                      </div>
                      <div v-if="r.example" class="mt-2">
                        <pre class="bg-stone-900 dark:bg-stone-950 rounded-lg px-3 py-2 text-xs font-mono text-stone-300 overflow-x-auto">{{ r.example }}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </template>

    <!-- Models -->
    <section class="space-y-0">
      <button
        @click="modelsExpanded = !modelsExpanded"
        class="w-full flex items-center gap-3 py-3 text-left"
      >
        <h2 class="text-sm font-semibold text-stone-700 dark:text-stone-300">Models</h2>
        <svg
          class="ml-auto w-4 h-4 text-stone-400 transition-transform"
          :class="{ '-rotate-90': !modelsExpanded }"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div v-show="modelsExpanded" class="space-y-2">
        <div
          v-for="model in models"
          :key="model.name"
          class="rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden"
        >
          <button
            @click="expandedModels[model.name] = !expandedModels[model.name]"
            class="w-full flex items-center gap-3 px-4 py-3 text-left bg-white dark:bg-stone-900 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition"
          >
            <code class="text-sm font-mono font-semibold text-stone-700 dark:text-stone-300">{{ model.name }}</code>
            <span class="text-xs text-stone-400 dark:text-stone-500">{{ model.description }}</span>
            <svg
              class="ml-auto w-4 h-4 text-stone-400 transition-transform shrink-0"
              :class="{ 'rotate-180': expandedModels[model.name] }"
              fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <div v-if="expandedModels[model.name]" class="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-stone-100 dark:border-stone-800">
                  <th class="text-left px-4 py-2 text-xs font-medium text-stone-500 dark:text-stone-400 w-36">Field</th>
                  <th class="text-left px-3 py-2 text-xs font-medium text-stone-500 dark:text-stone-400 w-40">Type</th>
                  <th class="text-left px-3 py-2 text-xs font-medium text-stone-500 dark:text-stone-400">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="f in model.fields" :key="f.name" class="border-b border-stone-50 dark:border-stone-800/50 last:border-0">
                  <td class="px-4 py-2">
                    <code class="font-mono text-xs text-primary-600 dark:text-primary-400">{{ f.name }}</code>
                  </td>
                  <td class="px-3 py-2">
                    <code class="font-mono text-[11px] text-stone-500 dark:text-stone-400">{{ f.type }}</code>
                  </td>
                  <td class="px-3 py-2 text-xs text-stone-600 dark:text-stone-400">{{ f.description }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
