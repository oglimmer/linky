export interface Link {
  id: number
  linkUrl: string
  tags: string[]
  pageTitle?: string
  notes?: string
  rssUrl?: string
  faviconUrl?: string
  callCounter: number
  lastCalled?: string
  createdDate?: string
}

export interface LinkPayload {
  url: string
  tags: string
  rssUrl?: string
  pageTitle?: string
  notes?: string
}

export interface LinkMutationResponse {
  primary: Link
  collateral: Link[]
}

export interface TagNode {
  name: string
  parent: string
  index: number
}

export interface TagHierarchyResponse {
  tree: TagNode[]
  tagCount: Record<string, number>
}

export interface RssUpdate {
  link: string
  title: string
}

export interface RssDetailsResponse {
  result: number
  display: RssUpdate[]
}

export type SortColumn = 'mostUsed' | 'lastUsed' | 'lastAdded' | 'title' | 'url'
export type SortOrder = 1 | -1
export type LinkColumn = 'pageTitle' | 'linkUrl' | 'notes' | 'tags' | 'rssUrl'
