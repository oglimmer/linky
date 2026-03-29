import { onMounted, onUnmounted } from 'vue'
import { useLinksStore } from '@/stores/links'

const POLL_INTERVAL = 5 * 60 * 1000 // 5 minutes

export function useRssPolling() {
  const linksStore = useLinksStore()
  let timer: ReturnType<typeof setInterval> | null = null

  function start() {
    linksStore.fetchAllRssUpdates()
    timer = setInterval(() => {
      linksStore.fetchAllRssUpdates()
    }, POLL_INTERVAL)
  }

  function stop() {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
  }

  onMounted(start)
  onUnmounted(stop)

  return { start, stop }
}
