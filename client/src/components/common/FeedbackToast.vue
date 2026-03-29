<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import { XMarkIcon } from '@heroicons/vue/20/solid'

const ui = useUiStore()
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      <!-- Error -->
      <Transition enter-from-class="translate-x-full opacity-0" enter-active-class="transition duration-300" leave-to-class="translate-x-full opacity-0" leave-active-class="transition duration-200">
        <div v-if="ui.errorMessage" class="flex items-start gap-2 bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm">
          <span class="flex-1">{{ ui.errorMessage }}</span>
          <button @click="ui.clearError()" class="shrink-0 hover:bg-red-700 rounded p-0.5"><XMarkIcon class="w-4 h-4" /></button>
        </div>
      </Transition>

      <!-- Info -->
      <Transition enter-from-class="translate-x-full opacity-0" enter-active-class="transition duration-300" leave-to-class="translate-x-full opacity-0" leave-active-class="transition duration-200">
        <div v-if="ui.infoMessage" class="flex items-start gap-2 bg-primary-600 text-white px-4 py-3 rounded-xl shadow-lg text-sm">
          <span class="flex-1">{{ ui.infoMessage }}</span>
          <button @click="ui.clearInfo()" class="shrink-0 hover:bg-primary-700 rounded p-0.5"><XMarkIcon class="w-4 h-4" /></button>
        </div>
      </Transition>

      <!-- Temp -->
      <Transition enter-from-class="translate-x-full opacity-0" enter-active-class="transition duration-300" leave-to-class="translate-x-full opacity-0" leave-active-class="transition duration-200">
        <div v-if="ui.tempMessage" class="bg-stone-800 text-white px-4 py-3 rounded-xl shadow-lg text-sm">
          {{ ui.tempMessage }}
        </div>
      </Transition>
    </div>
  </Teleport>
</template>
