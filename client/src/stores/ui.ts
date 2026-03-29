import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const errorMessage = ref<string | null>(null)
  const infoMessage = ref<string | null>(null)
  const tempMessage = ref<string | null>(null)

  let tempTimeout: ReturnType<typeof setTimeout> | null = null

  function setError(msg: string) {
    errorMessage.value = msg
  }

  function setInfo(msg: string) {
    infoMessage.value = msg
  }

  function setTemp(msg: string, duration = 3000) {
    tempMessage.value = msg
    if (tempTimeout) clearTimeout(tempTimeout)
    tempTimeout = setTimeout(() => {
      tempMessage.value = null
    }, duration)
  }

  function clearError() {
    errorMessage.value = null
  }

  function clearInfo() {
    infoMessage.value = null
  }

  function clearAll() {
    errorMessage.value = null
    infoMessage.value = null
    tempMessage.value = null
  }

  return { errorMessage, infoMessage, tempMessage, setError, setInfo, setTemp, clearError, clearInfo, clearAll }
})
