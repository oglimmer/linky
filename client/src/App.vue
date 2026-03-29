<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import AppLayout from '@/components/layout/AppLayout.vue'
import FeedbackToast from '@/components/common/FeedbackToast.vue'

const auth = useAuthStore()

onMounted(() => {
  auth.checkOAuthToken()
})
</script>

<template>
  <AppLayout>
    <RouterView />
  </AppLayout>
  <FeedbackToast />
</template>
